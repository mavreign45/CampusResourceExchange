"""
Reservation service — Phase 4 business logic.

All state transitions, overlap detection, eligibility gating,
and RBAC enforcement live here; routers stay thin.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.reservation import Reservation, ReservationStatus, BLOCKING_STATUSES
from app.models.resource import Resource
from app.models.user import User, UserRole
from app.models.eligibility import EligibilityVerification, VerificationStatus
from app.schemas.reservation import ReservationCreate, ReservationReviewUpdate
from app.services import notification_service

logger = logging.getLogger(__name__)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_reservation_or_404(db: Session, reservation_id: int) -> Reservation:
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation {reservation_id} not found.",
        )
    return r


def _is_reviewer(user: User) -> bool:
    return user.role in (UserRole.CUSTODIAN.value, UserRole.ADMIN.value)


def _assert_reviewer(user: User) -> None:
    if not _is_reviewer(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Lab Custodians and Admins can perform this action.",
        )


def _assert_owns_or_reviewer(reservation: Reservation, user: User) -> None:
    if reservation.requester_id != user.id and not _is_reviewer(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this reservation.",
        )


def _check_resource_exists(db: Session, resource_id: str) -> Resource:
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource '{resource_id}' not found.",
        )
    return resource


def _check_time_overlap(
    db: Session, resource_id: str, start_at: datetime, end_at: datetime,
    exclude_id: Optional[int] = None,
) -> None:
    """
    Raises 409 if any BLOCKING reservation overlaps the requested window.
    Overlap condition: existing.start_at < requested.end_at
                   AND existing.end_at   > requested.start_at
    """
    blocking_values = [s.value for s in BLOCKING_STATUSES]

    query = db.query(Reservation).filter(
        Reservation.resource_id == resource_id,
        Reservation.status.in_(blocking_values),
        Reservation.start_at < end_at,
        Reservation.end_at > start_at,
    )
    if exclude_id is not None:
        query = query.filter(Reservation.id != exclude_id)

    conflict = query.first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Reservation window conflicts with an existing {conflict.status} "
                f"reservation (id={conflict.id}) for this resource."
            ),
        )


def _transition(
    reservation: Reservation,
    allowed_from: tuple,
    new_status: ReservationStatus,
    db: Session,
) -> Reservation:
    if reservation.status not in allowed_from:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot transition from '{reservation.status}' to '{new_status.value}'. "
                f"Expected current status: {' or '.join(allowed_from)}."
            ),
        )
    reservation.status = new_status.value
    try:
        db.commit()
        db.refresh(reservation)
    except Exception:
        db.rollback()
        raise
    return reservation


# ─── Service functions ────────────────────────────────────────────────────────

def create_reservation(
    db: Session, payload: ReservationCreate, requester: User
) -> Reservation:
    # Validate resource exists
    resource = _check_resource_exists(db, payload.resource_id)

    # Check resource is bookable
    if resource.availability_status == "maintenance":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource is currently under maintenance and unavailable for booking.",
        )

    # Basic time sanity (also enforced by schema but be explicit)
    now = datetime.now(timezone.utc)
    if payload.start_at < now:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Reservation start time cannot be in the past.",
        )

    # Verify duration does not exceed max borrow hours if configured
    if resource.max_borrow_hours and resource.max_borrow_hours > 0:
        requested_hours = (payload.end_at - payload.start_at).total_seconds() / 3600
        if requested_hours > resource.max_borrow_hours:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Requested duration ({requested_hours:.1f}h) exceeds the maximum allowed "
                    f"borrow duration of {resource.max_borrow_hours}h for this resource."
                ),
            )

    # Verify eligibility/training requirement if required
    if resource.requires_verification:
        clearance_conditions = [EligibilityVerification.resource_id == resource.id]
        if resource.training_requirement:
            clearance_conditions.append(
                EligibilityVerification.requirement_type == resource.training_requirement
            )

        has_clearance = db.query(EligibilityVerification).filter(
            EligibilityVerification.user_id == requester.id,
            EligibilityVerification.status == VerificationStatus.VERIFIED.value,
            or_(*clearance_conditions),
        ).first()

        # Lab custodians and Admins are intrinsically authorized
        if not has_clearance and requester.role not in (UserRole.CUSTODIAN.value, UserRole.ADMIN.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Clearance required: You must have a verified '{resource.training_requirement or 'Safety Clearance'}' "
                    f"record to reserve this resource."
                ),
            )

    # Overlap guard
    _check_time_overlap(db, payload.resource_id, payload.start_at, payload.end_at)

    reservation = Reservation(
        resource_id=payload.resource_id,
        requester_id=requester.id,
        start_at=payload.start_at,
        end_at=payload.end_at,
        purpose=payload.purpose,
        status=ReservationStatus.PENDING.value,
        submitted_at=now,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    try:
        notification_service.notify_reservation_submitted(db, reservation)
    except Exception as exc:
        logger.warning(f"Failed to send submission notification: {exc}")

    return reservation


def get_my_reservations(db: Session, requester: User) -> List[Reservation]:
    return (
        db.query(Reservation)
        .filter(Reservation.requester_id == requester.id)
        .order_by(Reservation.created_at.desc())
        .all()
    )


def get_reservation_by_id(
    db: Session, reservation_id: int, current_user: User
) -> Reservation:
    r = _get_reservation_or_404(db, reservation_id)
    _assert_owns_or_reviewer(r, current_user)
    return r


def cancel_reservation(
    db: Session, reservation_id: int, current_user: User
) -> Reservation:
    r = _get_reservation_or_404(db, reservation_id)
    _assert_owns_or_reviewer(r, current_user)

    cancellable = (
        ReservationStatus.PENDING.value,
        ReservationStatus.APPROVED.value,
    )
    if r.resource:
        r.resource.availability_status = "available"
    cancelled = _transition(r, cancellable, ReservationStatus.CANCELLED, db)

    try:
        notification_service.notify_reservation_cancelled(db, cancelled, current_user)
    except Exception as exc:
        logger.warning(f"Failed to send cancellation notification: {exc}")

    return cancelled


def get_review_queue(
    db: Session, reviewer: User, status_filter: Optional[str] = None
) -> List[Reservation]:
    _assert_reviewer(reviewer)
    query = db.query(Reservation)
    if status_filter and status_filter.strip() and status_filter.strip() != "All":
        query = query.filter(Reservation.status == status_filter.strip())
    elif status_filter is None:
        query = query.filter(Reservation.status == ReservationStatus.PENDING.value)
    return query.order_by(Reservation.created_at.desc()).all()


def review_reservation(
    db: Session,
    reservation_id: int,
    payload: ReservationReviewUpdate,
    reviewer: User,
) -> Reservation:
    _assert_reviewer(reviewer)
    r = _get_reservation_or_404(db, reservation_id)

    # No self-review
    if r.requester_id == reviewer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot review your own reservation request.",
        )

    if r.status != ReservationStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only Pending reservations can be reviewed. Current status: '{r.status}'.",
        )

    now = datetime.now(timezone.utc)
    r.status = payload.status.value
    r.reviewed_by = reviewer.id
    r.reviewed_at = now
    if payload.status == ReservationStatus.APPROVED:
        r.approved_at = now
    if payload.review_notes is not None:
        r.review_notes = payload.review_notes
    db.commit()
    db.refresh(r)

    try:
        if payload.status == ReservationStatus.APPROVED:
            notification_service.notify_reservation_approved(db, r)
        elif payload.status == ReservationStatus.REJECTED:
            notification_service.notify_reservation_rejected(db, r)
    except Exception as exc:
        logger.warning(f"Failed to send review decision notification: {exc}")

    return r


def mark_ready_for_pickup(
    db: Session, reservation_id: int, reviewer: User
) -> Reservation:
    _assert_reviewer(reviewer)
    r = _get_reservation_or_404(db, reservation_id)
    updated = _transition(
        r,
        (ReservationStatus.APPROVED.value,),
        ReservationStatus.READY_FOR_PICKUP,
        db,
    )

    try:
        notification_service.notify_ready_for_pickup(db, updated)
    except Exception as exc:
        logger.warning(f"Failed to send ready for pickup notification: {exc}")

    return updated


def mark_collected(
    db: Session, reservation_id: int, reviewer: User
) -> Reservation:
    _assert_reviewer(reviewer)
    r = _get_reservation_or_404(db, reservation_id)
    r.collected_at = datetime.now(timezone.utc)
    if r.resource:
        r.resource.availability_status = "in_use"
    return _transition(
        r,
        (ReservationStatus.READY_FOR_PICKUP.value,),
        ReservationStatus.COLLECTED,
        db,
    )


def mark_return_pending(
    db: Session, reservation_id: int, reviewer: User
) -> Reservation:
    _assert_reviewer(reviewer)
    r = _get_reservation_or_404(db, reservation_id)
    r.returned_at = datetime.now(timezone.utc)
    return _transition(
        r,
        (ReservationStatus.COLLECTED.value,),
        ReservationStatus.RETURN_PENDING,
        db,
    )


def mark_completed(
    db: Session, reservation_id: int, reviewer: User
) -> Reservation:
    _assert_reviewer(reviewer)
    r = _get_reservation_or_404(db, reservation_id)
    if not r.returned_at:
        r.returned_at = datetime.now(timezone.utc)
    if r.resource:
        r.resource.availability_status = "available"
    updated = _transition(
        r,
        (ReservationStatus.RETURN_PENDING.value, ReservationStatus.OVERDUE.value),
        ReservationStatus.COMPLETED,
        db,
    )

    try:
        notification_service.notify_reservation_completed(db, updated)
    except Exception as exc:
        logger.warning(f"Failed to send completion notification: {exc}")

    return updated
