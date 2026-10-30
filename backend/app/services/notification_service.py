"""
Notification service for Campus Resource Exchange — Phase 5.

Handles notification creation, deduplication, retrieval,
marking as read, and event helper dispatchers.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from app.models.reservation import Reservation
from app.models.eligibility import EligibilityVerification, VerificationStatus

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    recipient_id: int,
    notification_type: str | NotificationType,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str | int] = None,
    allow_duplicate: bool = False,
) -> Notification:
    """
    Creates an in-app notification for the specified recipient.
    Provides deduplication to prevent duplicate alerts when an operation is retried.
    """
    type_val = notification_type.value if isinstance(notification_type, NotificationType) else str(notification_type)
    entity_id_str = str(entity_id) if entity_id is not None else None

    # Deduplication check
    if not allow_duplicate and entity_type and entity_id_str:
        existing = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == recipient_id,
                Notification.entity_type == entity_type,
                Notification.entity_id == entity_id_str,
                Notification.notification_type == type_val,
            )
            .first()
        )
        if existing:
            logger.debug(
                f"Duplicate notification suppressed: recipient={recipient_id}, "
                f"type={type_val}, entity={entity_type}:{entity_id_str}"
            )
            return existing

    notification = Notification(
        recipient_id=recipient_id,
        notification_type=type_val,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id_str,
        is_read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_user_notifications(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    is_read: Optional[bool] = None,
) -> Tuple[List[Notification], int, int]:
    """
    Fetches paginated notifications for the authenticated recipient.
    Returns (items, total_count, unread_count).
    """
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    query = db.query(Notification).filter(Notification.recipient_id == user_id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    total_count = query.count()
    unread_count = (
        db.query(Notification)
        .filter(Notification.recipient_id == user_id, Notification.is_read.is_(False))
        .count()
    )

    items = (
        query.order_by(desc(Notification.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total_count, unread_count


def get_unread_count(db: Session, user_id: int) -> int:
    """Returns number of unread notifications for a user."""
    return (
        db.query(Notification)
        .filter(Notification.recipient_id == user_id, Notification.is_read.is_(False))
        .count()
    )


def mark_as_read(db: Session, notification_id: int, current_user: User) -> Notification:
    """
    Marks a single notification as read.
    Enforces privacy: only the recipient can mark their notification as read.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification #{notification_id} not found.",
        )

    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this notification.",
        )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)

    return notification


def mark_all_as_read(db: Session, current_user: User) -> int:
    """
    Marks all unread notifications for the current user as read.
    Returns count of updated notifications.
    """
    now = datetime.now(timezone.utc)
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.recipient_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update(
            {"is_read": True, "read_at": now},
            synchronize_session="fetch",
        )
    )
    db.commit()
    return updated_count


# ─── Event Dispatchers ────────────────────────────────────────────────────────

def notify_reservation_submitted(db: Session, reservation: Reservation) -> None:
    """
    Notify requester that request was submitted, and notify custodians of a new request.
    """
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id

    # 1. Requester notification
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.RESERVATION_SUBMITTED,
        title="Reservation Request Submitted",
        message=(
            f"Your reservation request #{reservation.id} for '{resource_name}' "
            f"has been submitted and is pending custodian review."
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )

    # 2. Notify lab custodians & admins about pending review item
    custodians = (
        db.query(User)
        .filter(
            User.role.in_([UserRole.CUSTODIAN.value, UserRole.ADMIN.value]),
            User.is_active.is_(True),
            User.id != reservation.requester_id,
        )
        .all()
    )
    for c in custodians:
        create_notification(
            db=db,
            recipient_id=c.id,
            notification_type=NotificationType.RESERVATION_SUBMITTED,
            title="New Reservation Pending Review",
            message=(
                f"A new reservation request #{reservation.id} for '{resource_name}' "
                f"has been submitted by {reservation.requester.full_name if reservation.requester else 'a student'}."
            ),
            entity_type="reservation",
            entity_id=reservation.id,
        )


def notify_reservation_approved(db: Session, reservation: Reservation) -> None:
    """Notify requester that their reservation was approved."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id
    notes_clause = f" Notes: {reservation.review_notes}" if reservation.review_notes else ""
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.RESERVATION_APPROVED,
        title="Reservation Approved",
        message=(
            f"Your reservation request #{reservation.id} for '{resource_name}' "
            f"has been approved.{notes_clause}"
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )


def notify_reservation_rejected(db: Session, reservation: Reservation) -> None:
    """Notify requester that their reservation was rejected."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id
    notes_clause = f" Reason: {reservation.review_notes}" if reservation.review_notes else ""
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.RESERVATION_REJECTED,
        title="Reservation Request Rejected",
        message=(
            f"Your reservation request #{reservation.id} for '{resource_name}' "
            f"was not approved.{notes_clause}"
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )


def notify_reservation_cancelled(
    db: Session, reservation: Reservation, cancelled_by: User
) -> None:
    """
    Notify relevant counterparty when a reservation is cancelled.
    If cancelled by requester, notify reviewer/custodian if already reviewed.
    If cancelled by custodian/admin, notify requester.
    """
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id

    if cancelled_by.id == reservation.requester_id:
        # Cancelled by requester -> notify reviewer if someone had approved/reviewed it
        if reservation.reviewed_by and reservation.reviewed_by != cancelled_by.id:
            create_notification(
                db=db,
                recipient_id=reservation.reviewed_by,
                notification_type=NotificationType.RESERVATION_CANCELLED,
                title="Reservation Cancelled by Requester",
                message=(
                    f"Reservation #{reservation.id} for '{resource_name}' "
                    f"was cancelled by the requester."
                ),
                entity_type="reservation",
                entity_id=reservation.id,
            )
    else:
        # Cancelled by custodian or admin -> notify requester
        create_notification(
            db=db,
            recipient_id=reservation.requester_id,
            notification_type=NotificationType.RESERVATION_CANCELLED,
            title="Reservation Cancelled by Administrator",
            message=(
                f"Your reservation #{reservation.id} for '{resource_name}' "
                f"was cancelled by lab administration."
            ),
            entity_type="reservation",
            entity_id=reservation.id,
        )


def notify_ready_for_pickup(db: Session, reservation: Reservation) -> None:
    """Notify requester equipment is ready for handover."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id
    loc_clause = ""
    if reservation.resource and reservation.resource.location:
        loc = reservation.resource.location
        loc_clause = f" at {loc.building} ({loc.room})"

    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.READY_FOR_PICKUP,
        title="Equipment Ready for Pickup",
        message=(
            f"'{resource_name}' for reservation #{reservation.id} is ready for pickup{loc_clause}. "
            f"Please bring your campus ID to collect."
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )


def notify_pickup_reminder(db: Session, reservation: Reservation) -> None:
    """Reminder for upcoming pickup."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id
    start_str = reservation.start_at.strftime("%b %d, %H:%M UTC") if reservation.start_at else "soon"
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.PICKUP_REMINDER,
        title="Pickup Reminder",
        message=(
            f"Reminder: Your pickup window for '{resource_name}' (Reservation #{reservation.id}) "
            f"starts at {start_str}."
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )


def notify_return_reminder(db: Session, reservation: Reservation) -> None:
    """Reminder for equipment return approaching deadline."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id
    end_str = reservation.end_at.strftime("%b %d, %H:%M UTC") if reservation.end_at else "soon"
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.RETURN_REMINDER,
        title="Equipment Return Reminder",
        message=(
            f"Reminder: '{resource_name}' (Reservation #{reservation.id}) is due for return by {end_str}."
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )


def notify_reservation_overdue(db: Session, reservation: Reservation) -> None:
    """Alert that reservation is overdue."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id

    # 1. Alert requester
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.RESERVATION_OVERDUE,
        title="Equipment Return Overdue",
        message=(
            f"ACTION REQUIRED: '{resource_name}' (Reservation #{reservation.id}) "
            f"is overdue. Please return the equipment to the laboratory immediately."
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )

    # 2. Alert custodian/reviewer if available
    if reservation.reviewed_by:
        create_notification(
            db=db,
            recipient_id=reservation.reviewed_by,
            notification_type=NotificationType.RESERVATION_OVERDUE,
            title="Overdue Equipment Alert",
            message=(
                f"Reservation #{reservation.id} for '{resource_name}' is now overdue. "
                f"Requester ID: {reservation.requester_id}."
            ),
            entity_type="reservation",
            entity_id=reservation.id,
        )


def notify_reservation_expired(db: Session, reservation: Reservation) -> None:
    """Notify requester and custodians that uncollected reservation was expired."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.RESERVATION_EXPIRED,
        title="Reservation Expired (Uncollected)",
        message=(
            f"Your reservation #{reservation.id} for '{resource_name}' has expired "
            f"because it was not collected within the allowed pickup window. "
            f"The asset has been returned to the catalog."
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )


def notify_reservation_completed(db: Session, reservation: Reservation) -> None:
    """Notify requester that equipment return has been verified and reservation completed."""
    resource_name = reservation.resource.name if reservation.resource else reservation.resource_id
    create_notification(
        db=db,
        recipient_id=reservation.requester_id,
        notification_type=NotificationType.RESERVATION_COMPLETED,
        title="Reservation Completed",
        message=(
            f"Thank you! Your return of '{resource_name}' (Reservation #{reservation.id}) "
            f"has been verified and completed."
        ),
        entity_type="reservation",
        entity_id=reservation.id,
    )


def notify_eligibility_reviewed(
    db: Session, record: EligibilityVerification
) -> None:
    """Notify user of their clearance review outcome (Verified or Rejected)."""
    is_verified = record.status == VerificationStatus.VERIFIED.value
    n_type = (
        NotificationType.ELIGIBILITY_VERIFIED
        if is_verified
        else NotificationType.ELIGIBILITY_REJECTED
    )
    title = (
        f"Clearance Verified: {record.requirement_type}"
        if is_verified
        else f"Clearance Request Not Approved: {record.requirement_type}"
    )
    status_str = "verified" if is_verified else "not approved"
    notes_clause = f" Reviewer notes: {record.review_notes}" if record.review_notes else ""

    create_notification(
        db=db,
        recipient_id=record.user_id,
        notification_type=n_type,
        title=title,
        message=(
            f"Your clearance request for '{record.requirement_type}' was {status_str} "
            f"by the lab custodian.{notes_clause}"
        ),
        entity_type="eligibility",
        entity_id=record.id,
    )
