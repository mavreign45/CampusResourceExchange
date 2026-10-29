import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.eligibility import (
    EligibilityRequestCreate,
    EligibilityReviewUpdate,
    EligibilityRead,
)
from app.services.eligibility_service import EligibilityService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/eligibility", tags=["Eligibility & Verification"])

# Predefined standard campus certifications and clearances
CAMPUS_TRAINING_CATALOG = [
    {
        "id": "req-ee101",
        "title": "EE-101 Lab Safety & Equipment Handling Clearance",
        "department": "Department of Electrical & Computer Engineering",
        "description": "Fundamental high-voltage, ESD grounding, and test bench safety protocol.",
    },
    {
        "id": "req-media2",
        "title": "Media Guild Camera Custody Certification (Level 2)",
        "department": "School of Media Arts & Design",
        "description": "Full-frame cinema camera, XLR audio rigging, and field equipment custody clearance.",
    },
    {
        "id": "req-3dprint",
        "title": "Makerspace 3D Printing Induction & Cura Slicer Clearance",
        "department": "Campus Makerspace & Fabrication Lab",
        "description": "Filament temperature management, slicer slicing verification, and hotend safety.",
    },
    {
        "id": "req-hpc",
        "title": "HPC Cluster Ethics & Resource Fairness Agreement",
        "department": "School of Computing & Data Science",
        "description": "High-performance compute etiquette, checkpointing rules, and GPU resource quota policy.",
    },
    {
        "id": "req-cnc",
        "title": "CNC Mill Safety Protocol & Speeds/Feeds Workshop Certification",
        "department": "Department of Mechanical & Mechatronics Engineering",
        "description": "Personal protective equipment, swarf handling, tool offsets, and spindle interlock procedures.",
    },
    {
        "id": "req-bsl1",
        "title": "Biosafety Level 1 (BSL-1) & Bio-analytical Instrumentation Training",
        "department": "Department of Bioengineering & Molecular Sciences",
        "description": "Chemical hygiene, decontamination protocol, quartz optical maintenance, and pipetting standards.",
    },
]


@router.get(
    "/requirements",
    summary="Get campus training requirements catalog",
    description="Returns standard safety clearances and training requirements recognized across campus labs.",
)
def get_requirements_catalog() -> list:
    return CAMPUS_TRAINING_CATALOG


@router.get(
    "/me",
    response_model=List[EligibilityRead],
    summary="Get current user's eligibility and training status",
    description="Returns all verified, pending, and rejected clearance requests for the logged-in user.",
)
def get_my_eligibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[EligibilityRead]:
    records = EligibilityService.get_user_records(db=db, user_id=current_user.id)
    return [EligibilityRead.model_validate(r) for r in records]


@router.post(
    "/requests",
    response_model=EligibilityRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an eligibility / training verification request",
    description="Allows students and faculty to submit proof of training for equipment access. Requests are placed in 'Pending Review'.",
)
def submit_verification_request(
    request_in: EligibilityRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EligibilityRead:
    record = EligibilityService.submit_request(
        db=db,
        user_id=current_user.id,
        request_in=request_in,
    )
    return EligibilityRead.model_validate(record)


@router.get(
    "/requests",
    response_model=List[EligibilityRead],
    summary="List verification requests for review (Reviewers & Admins only)",
    description="Allows Lab Custodians, Faculty, and Admins to inspect submitted verification requests.",
)
def list_verification_requests(
    status: Optional[str] = Query(None, description="Filter by status (e.g. 'Pending Review', 'Verified', 'Rejected')"),
    user_id: Optional[int] = Query(None, description="Filter by specific student ID"),
    db: Session = Depends(get_db),
    reviewer: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.CUSTODIAN, UserRole.FACULTY)
    ),
) -> List[EligibilityRead]:
    records = EligibilityService.list_requests_for_reviewer(
        db=db,
        reviewer=reviewer,
        status_filter=status,
        user_id=user_id,
    )
    return [EligibilityRead.model_validate(r) for r in records]


@router.patch(
    "/requests/{id}/review",
    response_model=EligibilityRead,
    summary="Approve or reject a verification request (Custodians & Admins only)",
    description="Performs an official verification decision. Records reviewer identity, timestamp, and audit notes.",
)
def review_verification_request(
    id: int,
    review_in: EligibilityReviewUpdate,
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_roles(UserRole.ADMIN, UserRole.CUSTODIAN)),
) -> EligibilityRead:
    record = EligibilityService.review_request(
        db=db,
        request_id=id,
        reviewer=reviewer,
        review_in=review_in,
    )
    return EligibilityRead.model_validate(record)
