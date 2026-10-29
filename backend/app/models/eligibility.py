from enum import Enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class VerificationStatus(str, Enum):
    NOT_SUBMITTED = "Not Submitted"
    PENDING = "Pending Review"
    VERIFIED = "Verified"
    REJECTED = "Rejected"
    EXPIRED = "Expired"


class EligibilityVerification(Base):
    __tablename__ = "eligibility_verifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(String(64), ForeignKey("resources.id", ondelete="SET NULL"), nullable=True, index=True)
    requirement_type = Column(String(120), nullable=False, index=True)
    status = Column(String(50), nullable=False, default=VerificationStatus.PENDING.value, index=True)
    evidence_details = Column(Text, nullable=True)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="eligibility_requests", lazy="joined")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_eligibility_requests", lazy="joined")
    resource = relationship("Resource", foreign_keys=[resource_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<EligibilityVerification id={self.id} user_id={self.user_id} req='{self.requirement_type}' status='{self.status}'>"
