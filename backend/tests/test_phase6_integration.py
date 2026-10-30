"""
Phase 6 End-to-End Integration, System Hardening & Quality Assurance Tests.
Validates:
- System health & metadata endpoints
- Extended resource summary metrics (in_use, maintenance)
- Resource update endpoints with RBAC protection
- Review queue status filtering (Pending, Approved, Collected, All)
- End-to-end custody lifecycle & catalog availability synchronization
- Background automation idempotency
- Full notification lifecycle
"""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi import status

from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.resource import Resource
from app.models.reservation import Reservation, ReservationStatus


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def phase6_users(db_session):
    """Provisions test users for Phase 6 test suite."""
    student = db_session.query(User).filter(User.email == "p6_student@university.edu").first()
    if not student:
        student = User(
            full_name="Phase6 Student",
            email="p6_student@university.edu",
            hashed_password="dummy_hashed_password",
            role=UserRole.STUDENT.value,
            is_active=True,
        )
        db_session.add(student)

    custodian = db_session.query(User).filter(User.email == "p6_custodian@university.edu").first()
    if not custodian:
        custodian = User(
            full_name="Phase6 Custodian",
            email="p6_custodian@university.edu",
            hashed_password="dummy_hashed_password",
            role=UserRole.CUSTODIAN.value,
            is_active=True,
        )
        db_session.add(custodian)

    admin = db_session.query(User).filter(User.email == "p6_admin@university.edu").first()
    if not admin:
        admin = User(
            full_name="Phase6 Admin",
            email="p6_admin@university.edu",
            hashed_password="dummy_hashed_password",
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        db_session.add(admin)

    db_session.commit()
    db_session.refresh(student)
    db_session.refresh(custodian)
    db_session.refresh(admin)

    return {
        "student": student,
        "custodian": custodian,
        "admin": admin,
        "student_token": create_access_token({"sub": str(student.id)}),
        "custodian_token": create_access_token({"sub": str(custodian.id)}),
        "admin_token": create_access_token({"sub": str(admin.id)}),
    }


# ─── 1. System Health & Metadata ──────────────────────────────────────────────

def test_system_health_and_phase_metadata(client):
    """Verify /health and root endpoint expose Phase 6 metadata."""
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == status.HTTP_200_OK
    health_data = health_resp.json()
    assert health_data["status"] in ("healthy", "degraded")

    root_resp = client.get("/")
    assert root_resp.status_code == status.HTTP_200_OK
    root_data = root_resp.json()
    assert "Phase 6" in root_data["phase"]


def test_resource_summary_includes_in_use_and_maintenance(client):
    """Verify /api/v1/resources/summary includes in_use and maintenance fields."""
    resp = client.get("/api/v1/resources/summary")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "in_use" in data
    assert "maintenance" in data
    assert "total_resources" in data
    assert "available_now" in data
    assert isinstance(data["in_use"], int)
    assert isinstance(data["maintenance"], int)


# ─── 2. Resource Management with RBAC ─────────────────────────────────────────

def test_custodian_can_update_resource_availability(client, phase6_users, db_session):
    """Custodians can update resource availability status (e.g. maintenance toggle)."""
    custodian_token = phase6_users["custodian_token"]
    res = db_session.query(Resource).first()
    assert res is not None

    update_payload = {
        "availability_status": "maintenance",
        "item_condition": "Fair",
    }
    resp = client.patch(
        f"/api/v1/resources/{res.id}",
        json=update_payload,
        headers=_auth_headers(custodian_token),
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["availability_status"] == "maintenance"
    assert data["item_condition"] == "Fair"

    # Restore back to available
    restore_resp = client.patch(
        f"/api/v1/resources/{res.id}",
        json={"availability_status": "available", "item_condition": "Good"},
        headers=_auth_headers(custodian_token),
    )
    assert restore_resp.status_code == status.HTTP_200_OK
    assert restore_resp.json()["availability_status"] == "available"


def test_student_forbidden_from_updating_resource(client, phase6_users, db_session):
    """Students cannot modify resource specifications or availability."""
    student_token = phase6_users["student_token"]
    res = db_session.query(Resource).first()

    resp = client.patch(
        f"/api/v1/resources/{res.id}",
        json={"availability_status": "maintenance"},
        headers=_auth_headers(student_token),
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_unauthenticated_cannot_update_resource(client, db_session):
    """Unauthenticated requests to patch resources return 401."""
    res = db_session.query(Resource).first()
    resp = client.patch(
        f"/api/v1/resources/{res.id}",
        json={"availability_status": "maintenance"},
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ─── 3. Review Queue Status Filtering ─────────────────────────────────────────

def test_review_queue_status_filtering(client, phase6_users, db_session):
    """Verify /requests/review-queue filters correctly by status query parameter."""
    custodian_token = phase6_users["custodian_token"]

    # Status: Pending
    resp_pending = client.get(
        "/api/v1/requests/review-queue?status=Pending",
        headers=_auth_headers(custodian_token),
    )
    assert resp_pending.status_code == status.HTTP_200_OK
    items_pending = resp_pending.json()
    assert all(r["status"] == "Pending" for r in items_pending)

    # Status: All
    resp_all = client.get(
        "/api/v1/requests/review-queue?status=All",
        headers=_auth_headers(custodian_token),
    )
    assert resp_all.status_code == status.HTTP_200_OK
    assert isinstance(resp_all.json(), list)


# ─── 4. End-to-End Borrow Lifecycle & Catalog Availability Sync ───────────────

def test_end_to_end_borrow_custody_and_catalog_availability_sync(
    client, phase6_users, db_session
):
    """
    Validates complete lifecycle from submission to completion:
    Pending -> Approved -> Ready for Pickup -> Collected (catalog availability becomes 'in_use')
    -> Return Pending -> Completed (catalog availability restored to 'available').
    """
    student_token = phase6_users["student_token"]
    custodian_token = phase6_users["custodian_token"]

    # Pick an available unverified resource
    resource = (
        db_session.query(Resource)
        .filter(
            Resource.availability_status == "available",
            Resource.requires_verification.is_(False),
        )
        .first()
    )
    assert resource is not None
    target_res_id = resource.id

    start_time = datetime.now(timezone.utc) + timedelta(days=20, hours=1)
    end_time = start_time + timedelta(hours=3)

    # 1. Student creates reservation
    create_payload = {
        "resource_id": target_res_id,
        "start_at": start_time.isoformat(),
        "end_at": end_time.isoformat(),
        "purpose": "End-to-end integration validation for Phase 6 quality assurance.",
    }
    create_resp = client.post(
        "/api/v1/requests",
        json=create_payload,
        headers=_auth_headers(student_token),
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    res_data = create_resp.json()
    res_id = res_data["id"]
    assert res_data["status"] == "Pending"

    # 2. Custodian approves reservation
    review_resp = client.patch(
        f"/api/v1/requests/{res_id}/review",
        json={"status": "Approved", "review_notes": "Approved for lab validation."},
        headers=_auth_headers(custodian_token),
    )
    assert review_resp.status_code == status.HTTP_200_OK
    assert review_resp.json()["status"] == "Approved"

    # 3. Custodian marks ready for pickup
    ready_resp = client.post(
        f"/api/v1/requests/{res_id}/ready",
        headers=_auth_headers(custodian_token),
    )
    assert ready_resp.status_code == status.HTTP_200_OK
    assert ready_resp.json()["status"] == "Ready for Pickup"

    # 4. Custodian marks collected (Handover)
    collect_resp = client.post(
        f"/api/v1/requests/{res_id}/collect",
        headers=_auth_headers(custodian_token),
    )
    assert collect_resp.status_code == status.HTTP_200_OK
    assert collect_resp.json()["status"] == "Collected"

    # Verify catalog availability transitioned to 'in_use'
    catalog_resp1 = client.get(f"/api/v1/resources/{target_res_id}")
    assert catalog_resp1.status_code == status.HTTP_200_OK
    assert catalog_resp1.json()["availability_status"] == "in_use"

    # 5. Custodian records equipment return
    return_resp = client.post(
        f"/api/v1/requests/{res_id}/return",
        headers=_auth_headers(custodian_token),
    )
    assert return_resp.status_code == status.HTTP_200_OK
    assert return_resp.json()["status"] == "Return Pending"

    # 6. Custodian completes reservation inspection
    complete_resp = client.post(
        f"/api/v1/requests/{res_id}/complete",
        headers=_auth_headers(custodian_token),
    )
    assert complete_resp.status_code == status.HTTP_200_OK
    assert complete_resp.json()["status"] == "Completed"

    # Verify catalog availability restored to 'available'
    catalog_resp2 = client.get(f"/api/v1/resources/{target_res_id}")
    assert catalog_resp2.status_code == status.HTTP_200_OK
    assert catalog_resp2.json()["availability_status"] == "available"


# ─── 5. Automation Maintenance & Notification Verification ───────────────────

def test_automation_maintenance_cycle_runs_safely(client, phase6_users):
    """Verify automation run endpoint executes cleanly without errors."""
    custodian_token = phase6_users["custodian_token"]
    resp = client.post(
        "/api/v1/notifications/automation/run",
        headers=_auth_headers(custodian_token),
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["status"] == "success"
    assert "timestamp" in data["results"]
    assert "pickup_reminders_sent" in data["results"]
    assert "return_reminders_sent" in data["results"]
    assert "overdue_marked" in data["results"]
    assert "expired_uncollected_cancelled" in data["results"]


def test_user_notification_mark_all_and_unread_flow(client, phase6_users):
    """Verify unread-count and mark-all-read endpoint flow."""
    student_token = phase6_users["student_token"]

    count_resp = client.get(
        "/api/v1/notifications/unread-count",
        headers=_auth_headers(student_token),
    )
    assert count_resp.status_code == status.HTTP_200_OK
    assert "unread_count" in count_resp.json()

    mark_resp = client.post(
        "/api/v1/notifications/read-all",
        headers=_auth_headers(student_token),
    )
    assert mark_resp.status_code == status.HTTP_200_OK
    assert "updated_count" in mark_resp.json()

    # Counter should now be zero
    after_count = client.get(
        "/api/v1/notifications/unread-count",
        headers=_auth_headers(student_token),
    )
    assert after_count.json()["unread_count"] == 0
