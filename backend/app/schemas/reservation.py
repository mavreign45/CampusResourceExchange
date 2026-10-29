"""
Pydantic v2 schemas for Reservation — Phase 4.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator

from app.models.reservation import ReservationStatus


# ─── Nested summary schemas ─────────────────────────────────────────────────

class CategorySummary(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ResourceSummary(BaseModel):
    id: str
    name: str
    category: Optional[CategorySummary] = None

    model_config = {"from_attributes": True}


class UserSummary(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


# ─── Request bodies ──────────────────────────────────────────────────────────

class ReservationCreate(BaseModel):
    resource_id: str
    start_at: datetime
    end_at: datetime
    purpose: str

    @field_validator("purpose")
    @classmethod
    def purpose_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Purpose cannot be empty.")
        if len(v) < 10:
            raise ValueError("Purpose must be at least 10 characters.")
        return v

    @model_validator(mode="after")
    def end_after_start(self) -> "ReservationCreate":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at.")
        delta_hours = (self.end_at - self.start_at).total_seconds() / 3600
        if delta_hours < 0.5:
            raise ValueError("Reservation window must be at least 30 minutes.")
        if delta_hours > 720:  # 30 days
            raise ValueError("Reservation window cannot exceed 720 hours (30 days).")
        return self


class ReservationReviewUpdate(BaseModel):
    """Custodian/Admin: approve or reject a pending reservation."""
    status: ReservationStatus
    review_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def must_be_review_decision(cls, v: ReservationStatus) -> ReservationStatus:
        if v not in (ReservationStatus.APPROVED, ReservationStatus.REJECTED):
            raise ValueError("Review status must be 'Approved' or 'Rejected'.")
        return v


# ─── Response schema ─────────────────────────────────────────────────────────

class ReservationRead(BaseModel):
    id: int
    resource_id: str
    requester_id: int
    reviewed_by: Optional[int] = None
    start_at: datetime
    end_at: datetime
    status: str
    purpose: str
    review_notes: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Joined data
    resource: Optional[ResourceSummary] = None
    requester: Optional[UserSummary] = None

    model_config = {"from_attributes": True}
