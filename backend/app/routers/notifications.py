"""
Notifications and Automation Router — Phase 5.
"""
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.notification import (
    NotificationRead,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.services import notification_service, automation_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="Get paginated notifications for the authenticated user",
)
def get_my_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    is_read: Optional[bool] = Query(None, description="Filter by read/unread status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationListResponse:
    items, total, unread = notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        is_read=is_read,
    )
    total_pages = ceil(total / page_size) if total > 0 else 0
    return NotificationListResponse(
        items=[NotificationRead.model_validate(item) for item in items],
        total=total,
        unread_count=unread,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get current count of unread notifications for top bar badge",
)
def get_my_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnreadCountResponse:
    count = notification_service.get_unread_count(db=db, user_id=current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationRead,
    summary="Mark a single notification as read (recipient ownership enforced)",
)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationRead:
    notification = notification_service.mark_as_read(
        db=db, notification_id=notification_id, current_user=current_user
    )
    return NotificationRead.model_validate(notification)


@router.post(
    "/read-all",
    summary="Mark all unread notifications as read for current user",
)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = notification_service.mark_all_as_read(db=db, current_user=current_user)
    return {
        "message": "All notifications marked as read.",
        "updated_count": updated,
    }


# ─── Automation Scheduler Endpoint ──────────────────────────────────────────

@router.post(
    "/automation/run",
    summary="Trigger reservation automation: reminders, overdue checks, and auto-expiry",
)
def trigger_automation_run(
    pickup_reminder_hours: float = Query(2.0, ge=0.5, le=72.0),
    return_reminder_hours: float = Query(2.0, ge=0.5, le=72.0),
    expiry_hours: float = Query(24.0, ge=1.0, le=168.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CUSTODIAN, UserRole.ADMIN)),
):
    """
    Executes the automation cycle. Restricted to Custodians & Admins.
    Can also be invoked on a cron schedule by an administrative service account.
    """
    results = automation_service.run_all_automation(
        db=db,
        pickup_reminder_hours=pickup_reminder_hours,
        return_reminder_hours=return_reminder_hours,
        expiry_hours=expiry_hours,
    )
    return {
        "status": "success",
        "executed_by": current_user.email,
        "results": results,
    }
