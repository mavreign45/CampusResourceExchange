"""
Reservations router — Phase 4.

IMPORTANT: /requests/review-queue MUST be defined before /requests/{id}
           to prevent FastAPI treating 'review-queue' as a path parameter.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.reservation import ReservationCreate, ReservationRead, ReservationReviewUpdate
from app.services import reservation_service

router = APIRouter(prefix="/requests", tags=["Reservations"])

# Reviewer role helper (used in multiple routes)
_REVIEWER_ROLES = (UserRole.CUSTODIAN, UserRole.ADMIN)


# ─── Student / Researcher endpoints ─────────────────────────────────────────

@router.post(
    "",
    response_model=ReservationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new resource reservation request",
)
def create_reservation(
    payload: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReservationRead:
    return reservation_service.create_reservation(db, payload, current_user)


@router.get(
    "/me",
    response_model=List[ReservationRead],
    summary="Get the authenticated user's own reservations",
)
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ReservationRead]:
    return reservation_service.get_my_reservations(db, current_user)


# ─── Reviewer-only: list queue (MUST come before /{id}) ─────────────────────

@router.get(
    "/review-queue",
    response_model=List[ReservationRead],
    summary="Get reservation requests for custodian review",
)
def get_review_queue(
    status: Optional[str] = Query(default=None, description="Optional status filter or 'All'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_REVIEWER_ROLES)),
) -> List[ReservationRead]:
    return reservation_service.get_review_queue(db, current_user, status_filter=status)


# ─── Single reservation (owner or reviewer) ──────────────────────────────────

@router.get(
    "/{reservation_id}",
    response_model=ReservationRead,
    summary="Get a single reservation (owner or reviewer only)",
)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReservationRead:
    return reservation_service.get_reservation_by_id(db, reservation_id, current_user)


@router.post(
    "/{reservation_id}/cancel",
    response_model=ReservationRead,
    summary="Cancel a reservation (owner or reviewer; only Pending or Approved)",
)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReservationRead:
    return reservation_service.cancel_reservation(db, reservation_id, current_user)


# ─── Custodian / Admin workflow ───────────────────────────────────────────────

@router.patch(
    "/{reservation_id}/review",
    response_model=ReservationRead,
    summary="Approve or reject a pending reservation (Custodian/Admin, no self-review)",
)
def review_reservation(
    reservation_id: int,
    payload: ReservationReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_REVIEWER_ROLES)),
) -> ReservationRead:
    return reservation_service.review_reservation(db, reservation_id, payload, current_user)


@router.post(
    "/{reservation_id}/ready",
    response_model=ReservationRead,
    summary="Mark reservation as Ready for Pickup (Approved → Ready for Pickup)",
)
def mark_ready_for_pickup(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_REVIEWER_ROLES)),
) -> ReservationRead:
    return reservation_service.mark_ready_for_pickup(db, reservation_id, current_user)


@router.post(
    "/{reservation_id}/collect",
    response_model=ReservationRead,
    summary="Record equipment collection (Ready for Pickup → Collected)",
)
def mark_collected(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_REVIEWER_ROLES)),
) -> ReservationRead:
    return reservation_service.mark_collected(db, reservation_id, current_user)


@router.post(
    "/{reservation_id}/return",
    response_model=ReservationRead,
    summary="Record equipment return (Collected → Return Pending)",
)
def mark_return_pending(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_REVIEWER_ROLES)),
) -> ReservationRead:
    return reservation_service.mark_return_pending(db, reservation_id, current_user)


@router.post(
    "/{reservation_id}/complete",
    response_model=ReservationRead,
    summary="Complete a reservation (Return Pending / Overdue → Completed)",
)
def mark_completed(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_REVIEWER_ROLES)),
) -> ReservationRead:
    return reservation_service.mark_completed(db, reservation_id, current_user)
