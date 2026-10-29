import uuid
import pytest
from fastapi import status
from app.models.user import User, UserRole
from app.models.eligibility import VerificationStatus, EligibilityVerification
from app.core.security import create_access_token, hash_password


@pytest.fixture
def auth_users(db_session):
    """Creates an isolated student, lab custodian, and administrator for eligibility testing."""
    uid = uuid.uuid4().hex[:6]
    student = User(
        full_name="Sarah Bio Student",
        email=f"sarah.bio.{uid}@university.edu",
        hashed_password=hash_password("Pass12345!"),
        role=UserRole.STUDENT.value,
        is_active=True,
    )
    custodian = User(
        full_name="Dr. Custodian Vance",
        email=f"custodian.vance.{uid}@university.edu",
        hashed_password=hash_password("Pass12345!"),
        role=UserRole.CUSTODIAN.value,
        is_active=True,
    )
    admin = User(
        full_name="Dean Administration",
        email=f"dean.admin.{uid}@university.edu",
        hashed_password=hash_password("Pass12345!"),
        role=UserRole.ADMIN.value,
        is_active=True,
    )

    db_session.add_all([student, custodian, admin])
    db_session.commit()
    db_session.refresh(student)
    db_session.refresh(custodian)
    db_session.refresh(admin)

    # Seed a default pending verification request for the student
    pending_req = EligibilityVerification(
        user_id=student.id,
        requirement_type="Laser Safety Certification",
        resource_id="res-osc-01",
        evidence_details="Initial safety workshop completed.",
        status=VerificationStatus.PENDING.value,
    )
    db_session.add(pending_req)
    db_session.commit()
    db_session.refresh(pending_req)

    yield {
        "student": student,
        "student_token": create_access_token({"sub": str(student.id), "email": student.email, "role": student.role}),
        "custodian": custodian,
        "custodian_token": create_access_token({"sub": str(custodian.id), "email": custodian.email, "role": custodian.role}),
        "admin": admin,
        "admin_token": create_access_token({"sub": str(admin.id), "email": admin.email, "role": admin.role}),
        "pending_request": pending_req,
    }


def test_submit_eligibility_request(client, auth_users):
    """Test valid verification request submission by a student."""
    payload = {
        "requirement_type": "EE-101 Lab Safety & Equipment Handling Clearance",
        "resource_id": "res-osc-01",
        "evidence_details": "Completed safety workshop on Oct 2026. Certificate #EE-SAFE-8821.",
    }
    response = client.post(
        "/api/v1/eligibility/requests",
        json=payload,
        headers={"Authorization": f"Bearer {auth_users['student_token']}"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["status"] == VerificationStatus.PENDING.value
    assert data["requirement_type"] == payload["requirement_type"]
    assert data["user_id"] == auth_users["student"].id
    assert data["reviewed_by"] is None


def test_submit_eligibility_invalid_resource_rejected(client, auth_users):
    """Test requesting verification for nonexistent resource returns 404."""
    payload = {
        "requirement_type": "Laser Safety",
        "resource_id": "nonexistent-resource-id-xyz",
        "evidence_details": "Proof here",
    }
    response = client.post(
        "/api/v1/eligibility/requests",
        json=payload,
        headers={"Authorization": f"Bearer {auth_users['student_token']}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_my_eligibility_records(client, auth_users):
    """Test student retrieving only their own eligibility records."""
    response = client.get(
        "/api/v1/eligibility/me",
        headers={"Authorization": f"Bearer {auth_users['student_token']}"},
    )
    assert response.status_code == status.HTTP_200_OK
    records = response.json()
    assert len(records) >= 1
    assert all(r["user_id"] == auth_users["student"].id for r in records)


def test_student_cannot_access_review_queue(client, auth_users):
    """Test that a regular Student is denied access (HTTP 403) to the reviewer queue."""
    response = client.get(
        "/api/v1/eligibility/requests",
        headers={"Authorization": f"Bearer {auth_users['student_token']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_custodian_can_view_review_queue(client, auth_users):
    """Test that a Lab Custodian can inspect pending verification requests."""
    response = client.get(
        "/api/v1/eligibility/requests?status=Pending+Review",
        headers={"Authorization": f"Bearer {auth_users['custodian_token']}"},
    )
    assert response.status_code == status.HTTP_200_OK
    requests = response.json()
    assert len(requests) >= 1
    assert any(r["user_id"] == auth_users["student"].id for r in requests)


def test_reviewer_can_approve_request(client, auth_users):
    """Test custodian approving a student's verification request with notes."""
    req = auth_users["pending_request"]

    review_payload = {
        "status": VerificationStatus.VERIFIED.value,
        "review_notes": "Verified against departmental training log. Valid for academic year.",
    }
    response = client.patch(
        f"/api/v1/eligibility/requests/{req.id}/review",
        json=review_payload,
        headers={"Authorization": f"Bearer {auth_users['custodian_token']}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == VerificationStatus.VERIFIED.value
    assert data["reviewed_by"] == auth_users["custodian"].id
    assert data["reviewed_at"] is not None
    assert "Verified against departmental training log" in data["review_notes"]


def test_reviewer_cannot_approve_own_request(client, auth_users, db_session):
    """Test that a reviewer cannot review their own verification request (conflict of interest)."""
    # Custodian submits a request for themselves
    custodian_req = EligibilityVerification(
        user_id=auth_users["custodian"].id,
        requirement_type="Cleanroom Safety Protocol",
        status=VerificationStatus.PENDING.value,
    )
    db_session.add(custodian_req)
    db_session.commit()
    db_session.refresh(custodian_req)

    # Custodian tries to review their own request
    response = client.patch(
        f"/api/v1/eligibility/requests/{custodian_req.id}/review",
        json={"status": VerificationStatus.VERIFIED.value},
        headers={"Authorization": f"Bearer {auth_users['custodian_token']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "cannot approve or reject their own" in response.json()["detail"].lower()


def test_invalid_status_transition_rejected(client, auth_users):
    """Test attempting to transition to an invalid status (e.g. back to Pending Review)."""
    req = auth_users["pending_request"]

    response = client.patch(
        f"/api/v1/eligibility/requests/{req.id}/review",
        json={"status": VerificationStatus.PENDING.value},  # Invalid target
        headers={"Authorization": f"Bearer {auth_users['admin_token']}"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "must be either 'verified' or 'rejected'" in response.json()["detail"].lower()


def test_review_missing_request_returns_404(client, auth_users):
    """Test reviewing nonexistent request returns 404."""
    response = client.patch(
        "/api/v1/eligibility/requests/99999/review",
        json={"status": VerificationStatus.VERIFIED.value},
        headers={"Authorization": f"Bearer {auth_users['admin_token']}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
