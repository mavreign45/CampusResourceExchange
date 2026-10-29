"""
Reservation model for Campus Resource Exchange — Phase 4.

Status lifecycle:
  Pending → Approved | Rejected
  Approved → Ready for Pickup | Cancelled
  Ready for Pickup → Collected | Cancelled
  Collected → Return Pending
  Return Pending → Completed | Overdue
  Overdue → Completed
  Completed (terminal)
  Rejected (terminal)
  Cancelled (terminal)
"""
from enum import Enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ReservationStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"
    READY_FOR_PICKUP = "Ready for Pickup"
    COLLECTED = "Collected"
    RETURN_PENDING = "Return Pending"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"


# Statuses that block a resource from being double-booked
BLOCKING_STATUSES: frozenset = frozenset(
    {
        ReservationStatus.PENDING,
        ReservationStatus.APPROVED,
        ReservationStatus.READY_FOR_PICKUP,
        ReservationStatus.COLLECTED,
        ReservationStatus.RETURN_PENDING,
    }
)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # The resource being reserved (soft FK to resources.id which is a VARCHAR)
    resource_id = Column(
        String(64),
        ForeignKey("resources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The student / researcher requesting the resource
    requester_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Custodian / admin who reviewed the request (nullable until reviewed)
    reviewed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Desired reservation window
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)

    # Current lifecycle status
    status = Column(
        String(50),
        nullable=False,
        default=ReservationStatus.PENDING.value,
        index=True,
    )

    # Why does the requester need this resource?
    purpose = Column(Text, nullable=False)

    # Optional notes added by custodian during review
    review_notes = Column(Text, nullable=True)

    # Detailed lifecycle timestamps
    submitted_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    collected_at = Column(DateTime(timezone=True), nullable=True)
    returned_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    resource = relationship("Resource", back_populates="reservations", lazy="joined")
    requester = relationship(
        "User",
        back_populates="reservations_made",
        foreign_keys=[requester_id],
        lazy="joined",
    )
    reviewer = relationship(
        "User",
        back_populates="reservations_reviewed",
        foreign_keys=[reviewed_by],
        lazy="select",
    )

    # Composite index for overlap detection queries
    __table_args__ = (
        Index("ix_reservations_resource_window", "resource_id", "start_at", "end_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<Reservation id={self.id} resource='{self.resource_id}' "
            f"requester={self.requester_id} status='{self.status}'>"
        )
