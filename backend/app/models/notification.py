"""
Notification model for Campus Resource Exchange — Phase 5.
"""
from enum import Enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class NotificationType(str, Enum):
    # Reservation events
    RESERVATION_SUBMITTED = "reservation_submitted"
    RESERVATION_APPROVED = "reservation_approved"
    RESERVATION_REJECTED = "reservation_rejected"
    RESERVATION_CANCELLED = "reservation_cancelled"
    READY_FOR_PICKUP = "ready_for_pickup"
    PICKUP_REMINDER = "pickup_reminder"
    RETURN_REMINDER = "return_reminder"
    RESERVATION_OVERDUE = "reservation_overdue"
    RESERVATION_EXPIRED = "reservation_expired"
    RESERVATION_COMPLETED = "reservation_completed"

    # Eligibility events
    ELIGIBILITY_SUBMITTED = "eligibility_submitted"
    ELIGIBILITY_VERIFIED = "eligibility_verified"
    ELIGIBILITY_REJECTED = "eligibility_rejected"

    # System notices
    SYSTEM_ALERT = "system_alert"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Recipient user (private to recipient)
    recipient_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Notification classification
    notification_type = Column(
        String(60),
        nullable=False,
        default=NotificationType.SYSTEM_ALERT.value,
        index=True,
    )

    # Content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    # Contextual entity link (e.g., 'reservation', 'eligibility')
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(String(64), nullable=True, index=True)

    # Read state
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    recipient = relationship(
        "User",
        back_populates="notifications",
        foreign_keys=[recipient_id],
        lazy="joined",
    )

    __table_args__ = (
        Index("ix_notifications_recipient_unread", "recipient_id", "is_read"),
        Index("ix_notifications_dedup", "recipient_id", "entity_type", "entity_id", "notification_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<Notification id={self.id} recipient={self.recipient_id} "
            f"type='{self.notification_type}' is_read={self.is_read}>"
        )
