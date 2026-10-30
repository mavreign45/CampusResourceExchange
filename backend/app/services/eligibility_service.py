import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from fastapi import HTTPException, status

from app.models.eligibility import EligibilityVerification, VerificationStatus
from app.models.user import User, UserRole
from app.models.resource import Resource
from app.schemas.eligibility import EligibilityRequestCreate, EligibilityReviewUpdate
from app.services import notification_service

logger = logging.getLogger(__name__)


class EligibilityService:
    @staticmethod
    def get_user_records(db: Session, user_id: int) -> List[EligibilityVerification]:
        """Fetches all eligibility and training records belonging to a user."""
        return (
            db.query(EligibilityVerification)
            .filter(EligibilityVerification.user_id == user_id)
            .order_by(desc(EligibilityVerification.submitted_at))
            .all()
        )

    @staticmethod
    def submit_request(
        db: Session,
        user_id: int,
        request_in: EligibilityRequestCreate,
    ) -> EligibilityVerification:
        """
        Submits a new training/eligibility verification request.
        Always created in 'Pending Review' state.
        Users cannot mark themselves as verified.
        """
        req_type = request_in.requirement_type.strip()

        # Check if resource exists if provided
        if request_in.resource_id:
            resource = db.query(Resource).filter(Resource.id == request_in.resource_id).first()
            if not resource:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Resource '{request_in.resource_id}' specified in the request does not exist.",
                )

        # Check for active existing verified or pending request for the same requirement
        existing = (
            db.query(EligibilityVerification)
            .filter(
                EligibilityVerification.user_id == user_id,
                EligibilityVerification.requirement_type == req_type,
                EligibilityVerification.status.in_([
                    VerificationStatus.PENDING.value,
                    VerificationStatus.VERIFIED.value,
                ]),
            )
            .first()
        )

        if existing:
            if existing.status == VerificationStatus.VERIFIED.value:
                # Check expiration
                if not existing.expires_at or existing.expires_at > datetime.now(timezone.utc):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"You already hold active verified clearance for '{req_type}'.",
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A verification request for '{req_type}' is already pending review.",
                )

        new_record = EligibilityVerification(
            user_id=user_id,
            resource_id=request_in.resource_id,
            requirement_type=req_type,
            status=VerificationStatus.PENDING.value,
            evidence_details=request_in.evidence_details.strip() if request_in.evidence_details else None,
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        logger.info(f"User ID {user_id} submitted verification request for '{req_type}' (Record ID: {new_record.id})")
        return new_record

    @staticmethod
    def list_requests_for_reviewer(
        db: Session,
        reviewer: User,
        status_filter: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> List[EligibilityVerification]:
        """
        Retrieves verification requests for authorized reviewers (Admin, Lab Custodian, Faculty).
        """
        query = db.query(EligibilityVerification)

        if status_filter and status_filter != "All":
            query = query.filter(EligibilityVerification.status == status_filter)

        if user_id:
            query = query.filter(EligibilityVerification.user_id == user_id)

        # For Lab Custodians: optionally filter by their department/resources or show all pending
        # Admins have full institutional oversight
        return query.order_by(desc(EligibilityVerification.submitted_at)).all()

    @staticmethod
    def review_request(
        db: Session,
        request_id: int,
        reviewer: User,
        review_in: EligibilityReviewUpdate,
    ) -> EligibilityVerification:
        """
        Performs an authorized review on a verification request.
        Only allows transition to 'Verified' or 'Rejected'.
        Records reviewer ID, timestamp, and review notes for auditability.
        """
        record = (
            db.query(EligibilityVerification)
            .filter(EligibilityVerification.id == request_id)
            .first()
        )

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Verification request with ID {request_id} was not found.",
            )

        # Prevent reviewing own request (conflict of interest)
        if record.user_id == reviewer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Reviewers cannot approve or reject their own verification requests.",
            )

        # Validate target status
        target_status = review_in.status.value if isinstance(review_in.status, VerificationStatus) else str(review_in.status)
        if target_status not in [VerificationStatus.VERIFIED.value, VerificationStatus.REJECTED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review decision must be either 'Verified' or 'Rejected'.",
            )

        record.status = target_status
        record.reviewed_by = reviewer.id
        record.reviewed_at = datetime.now(timezone.utc)
        record.review_notes = review_in.review_notes.strip() if review_in.review_notes else None
        if review_in.expires_at:
            record.expires_at = review_in.expires_at

        db.commit()
        db.refresh(record)
        logger.info(
            f"Reviewer '{reviewer.email}' (ID: {reviewer.id}) marked request {record.id} as '{record.status}'"
        )

        try:
            notification_service.notify_eligibility_reviewed(db, record)
        except Exception as exc:
            logger.warning(f"Failed to send eligibility review notification: {exc}")

        return record
