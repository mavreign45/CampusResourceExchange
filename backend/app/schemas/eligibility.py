from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.eligibility import VerificationStatus
from app.schemas.user import UserRead


class EligibilityRequestCreate(BaseModel):
    requirement_type: str = Field(..., min_length=3, max_length=120)
    resource_id: Optional[str] = Field(None, max_length=64)
    evidence_details: Optional[str] = Field(None, max_length=2000, description="Certificate reference or proof")


class EligibilityReviewUpdate(BaseModel):
    status: VerificationStatus
    review_notes: Optional[str] = Field(None, max_length=1000)
    expires_at: Optional[datetime] = None


class EligibilityRead(BaseModel):
    id: int
    user_id: int
    user: Optional[UserRead] = None
    resource_id: Optional[str] = None
    requirement_type: str
    status: VerificationStatus
    evidence_details: Optional[str] = None
    submitted_at: datetime
    reviewed_by: Optional[int] = None
    reviewer: Optional[UserRead] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
