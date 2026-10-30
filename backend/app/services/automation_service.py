"""
Reservation Automation & Lifecycle Maintenance Service — Phase 5.

Handles:
- Automated pickup reminders
- Automated return deadline reminders
- Automated overdue transitions for collected equipment
- Automatic expiration & cancellation for approved/ready reservations never collected
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.reservation import Reservation, ReservationStatus
from app.models.notification import Notification, NotificationType
from app.services import notification_service

logger = logging.getLogger(__name__)

# Default automation policies
DEFAULT_PICKUP_REMINDER_HOURS = 2.0
DEFAULT_RETURN_REMINDER_HOURS = 2.0
DEFAULT_UNCOLLECTED_EXPIRY_HOURS = 24.0


def send_pickup_reminders(
    db: Session, hours_ahead: float = DEFAULT_PICKUP_REMINDER_HOURS
) -> int:
    """
    Sends pickup reminders to requesters whose approved reservation window starts soon.
    Deduplicated: only sends once per reservation.
    """
    now = datetime.now(timezone.utc)
    threshold = now + timedelta(hours=hours_ahead)

    candidates = (
        db.query(Reservation)
        .filter(
            Reservation.status.in_([
                ReservationStatus.APPROVED.value,
                ReservationStatus.READY_FOR_PICKUP.value,
            ]),
            Reservation.start_at >= now,
            Reservation.start_at <= threshold,
        )
        .all()
    )

    count = 0
    for r in candidates:
        # Check deduplication
        already_sent = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == r.requester_id,
                Notification.entity_type == "reservation",
                Notification.entity_id == str(r.id),
                Notification.notification_type == NotificationType.PICKUP_REMINDER.value,
            )
            .first()
        )
        if not already_sent:
            notification_service.notify_pickup_reminder(db, r)
            count += 1
            logger.info(f"Sent pickup reminder for Reservation #{r.id} to user #{r.requester_id}")

    return count


def send_return_reminders(
    db: Session, hours_ahead: float = DEFAULT_RETURN_REMINDER_HOURS
) -> int:
    """
    Sends return reminders for collected equipment whose end_at is approaching.
    Deduplicated: only sends once per reservation.
    """
    now = datetime.now(timezone.utc)
    threshold = now + timedelta(hours=hours_ahead)

    candidates = (
        db.query(Reservation)
        .filter(
            Reservation.status == ReservationStatus.COLLECTED.value,
            Reservation.end_at >= now,
            Reservation.end_at <= threshold,
        )
        .all()
    )

    count = 0
    for r in candidates:
        already_sent = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == r.requester_id,
                Notification.entity_type == "reservation",
                Notification.entity_id == str(r.id),
                Notification.notification_type == NotificationType.RETURN_REMINDER.value,
            )
            .first()
        )
        if not already_sent:
            notification_service.notify_return_reminder(db, r)
            count += 1
            logger.info(f"Sent return reminder for Reservation #{r.id} to user #{r.requester_id}")

    return count


def process_overdue_reservations(db: Session) -> int:
    """
    Transitions collected equipment past their end_at deadline to 'Overdue'.
    Preserves audit history and alerts the borrower and custodian.
    """
    now = datetime.now(timezone.utc)

    overdue_items = (
        db.query(Reservation)
        .filter(
            Reservation.status == ReservationStatus.COLLECTED.value,
            Reservation.end_at < now,
        )
        .all()
    )

    count = 0
    for r in overdue_items:
        r.status = ReservationStatus.OVERDUE.value
        db.commit()
        db.refresh(r)

        notification_service.notify_reservation_overdue(db, r)
        count += 1
        logger.warning(f"Reservation #{r.id} marked as Overdue past {r.end_at}")

    return count


def process_expired_uncollected(
    db: Session, expiry_hours: float = DEFAULT_UNCOLLECTED_EXPIRY_HOURS
) -> int:
    """
    Expiry Policy:
    Reservations that were Approved or Ready for Pickup but never collected
    within the configured grace period (default 24h past start_at) are
    cancelled so other students/researchers can book the asset.

    STRICT SAFETY:
    - Never expires reservations that have been collected, returned, or completed.
    - Notifies the student and lab custodian of automatic cancellation.
    - Records audit note in review_notes.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=expiry_hours)

    abandoned = (
        db.query(Reservation)
        .filter(
            Reservation.status.in_([
                ReservationStatus.APPROVED.value,
                ReservationStatus.READY_FOR_PICKUP.value,
            ]),
            Reservation.start_at < cutoff,
        )
        .all()
    )

    count = 0
    for r in abandoned:
        r.status = ReservationStatus.CANCELLED.value
        if r.resource:
            r.resource.availability_status = "available"
        expiry_note = f"[Auto-Cancelled: Uncollected after {expiry_hours}h grace period]"
        r.review_notes = f"{r.review_notes}\n{expiry_note}" if r.review_notes else expiry_note
        db.commit()
        db.refresh(r)

        notification_service.notify_reservation_expired(db, r)
        count += 1
        logger.info(f"Reservation #{r.id} auto-expired/cancelled due to non-collection")

    return count


def run_all_automation(
    db: Session,
    pickup_reminder_hours: float = DEFAULT_PICKUP_REMINDER_HOURS,
    return_reminder_hours: float = DEFAULT_RETURN_REMINDER_HOURS,
    expiry_hours: float = DEFAULT_UNCOLLECTED_EXPIRY_HOURS,
) -> Dict[str, Any]:
    """
    Executes the full maintenance cycle:
    1. Sends pickup reminders
    2. Sends return reminders
    3. Detects and transitions overdue items
    4. Auto-expires abandoned uncollected reservations
    """
    pickups = send_pickup_reminders(db, hours_ahead=pickup_reminder_hours)
    returns = send_return_reminders(db, hours_ahead=return_reminder_hours)
    overdue = process_overdue_reservations(db)
    expired = process_expired_uncollected(db, expiry_hours=expiry_hours)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pickup_reminders_sent": pickups,
        "return_reminders_sent": returns,
        "overdue_marked": overdue,
        "expired_uncollected_cancelled": expired,
    }
