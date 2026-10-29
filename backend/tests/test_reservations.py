"""
Phase 4 — Comprehensive Reservation & Custody Workflow Tests.

Covers:
- Reservation creation & validation (times, duration, purpose)
- Overlapping conflict detection (interval overlap rule)
- Eligibility & training requirements enforcement
- Maintenance status blocking
- Ownership & role-based access control (RBAC)
- Custodian review queue & decisions (no self-approval)
- Full custody lifecycle (Pending -> Approved -> Ready for Pickup -> Collected -> Return Pending -> Completed)
- Detailed lifecycle timestamps (submitted_at, reviewed_at, approved_at, collected_at, returned_at)
- Cancellation permissions & states
"""
import uuid
from datetime import datetime, timezone, timedelta

import pytest
from fastapi.testclient import TestClient

from app.models.user import User, UserRole
from app.models.reservation import Reservation, ReservationStatus
from app.models.resource import Resource as ResourceModel
from app.models.eligibility import EligibilityVerification, VerificationStatus
from app.core.security import hash_password


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _make_user(db, full_name: str, role: str) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        full_name=full_name,
        email=f"{full_name.lower().replace(' ', '.')}.{suffix}@campus.edu",
        hashed_password=hash_password("Password123!"),
        role=role,
        department="Test Department",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client: TestClient, email: str, password: str = "Password123!") -> str:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _future_window(offset_hours: int = 24, duration_hours: int = 2) -> dict:
    start = datetime.now(timezone.utc) + timedelta(hours=offset_hours)
    end = start + timedelta(hours=duration_hours)
    return {
        "start_at": start.isoformat(),
        "end_at": end.isoformat(),
    }


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def open_resource_id(db_session) -> str:
    """Return an available resource that requires no specialized safety clearance."""
    r = (
        db_session.query(ResourceModel)
        .filter(
            ResourceModel.requires_verification.is_(False),
            ResourceModel.availability_status == "available",
        )
        .first()
    )
    assert r is not None, "No open resource found in seeded database"
    return r.id


@pytest.fixture
def verified_resource(db_session) -> ResourceModel:
    """Return a resource requiring verified training."""
    r = (
        db_session.query(ResourceModel)
        .filter(
            ResourceModel.requires_verification.is_(True),
            ResourceModel.availability_status == "available",
        )
        .first()
    )
    assert r is not None, "No verified resource found in seeded database"
    return r


@pytest.fixture
def maintenance_resource_id(db_session) -> str:
    """Return a resource currently under maintenance."""
    r = (
        db_session.query(ResourceModel)
        .filter(ResourceModel.availability_status == "maintenance")
        .first()
    )
    assert r is not None, "No maintenance resource found in seeded database"
    return r.id


@pytest.fixture
def student_user(db_session):
    user = _make_user(db_session, "Alice Student", UserRole.STUDENT.value)
    yield user
    db_session.delete(user)
    db_session.commit()


@pytest.fixture
def second_student_user(db_session):
    user = _make_user(db_session, "Charlie Student", UserRole.STUDENT.value)
    yield user
    db_session.delete(user)
    db_session.commit()


@pytest.fixture
def custodian_user(db_session):
    user = _make_user(db_session, "Bob Custodian", UserRole.CUSTODIAN.value)
    yield user
    db_session.delete(user)
    db_session.commit()


@pytest.fixture
def student_token(client, student_user):
    return _login(client, student_user.email)


@pytest.fixture
def second_student_token(client, second_student_user):
    return _login(client, second_student_user.email)


@pytest.fixture
def custodian_token(client, custodian_user):
    return _login(client, custodian_user.email)


# ─── Tests ───────────────────────────────────────────────────────────────────

class TestCreateReservation:
    def test_create_reservation_success(self, client, student_token, open_resource_id):
        window = _future_window(offset_hours=24, duration_hours=3)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Senior design project measurement and prototype testing.",
            **window,
        }
        resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["status"] == "Pending"
        assert data["resource_id"] == open_resource_id
        assert "id" in data
        assert data["submitted_at"] is not None

    def test_create_requires_authentication(self, client, open_resource_id):
        window = _future_window(offset_hours=48)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Unauthenticated test must be rejected with 401.",
            **window,
        }
        resp = client.post("/api/v1/requests", json=payload)
        assert resp.status_code == 401

    def test_create_invalid_resource(self, client, student_token):
        window = _future_window(offset_hours=72)
        payload = {
            "resource_id": "non-existent-resource-xyz",
            "purpose": "This resource does not exist in the database.",
            **window,
        }
        resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert resp.status_code == 404

    def test_create_end_before_start_rejected(self, client, student_token, open_resource_id):
        start = datetime.now(timezone.utc) + timedelta(hours=100)
        end = start - timedelta(hours=1)
        payload = {
            "resource_id": open_resource_id,
            "start_at": start.isoformat(),
            "end_at": end.isoformat(),
            "purpose": "End before start must fail validation.",
        }
        resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert resp.status_code == 422

    def test_create_purpose_too_short(self, client, student_token, open_resource_id):
        window = _future_window(offset_hours=120)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "short",
            **window,
        }
        resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert resp.status_code == 422

    def test_maintenance_resource_rejected(self, client, student_token, maintenance_resource_id):
        window = _future_window(offset_hours=140)
        payload = {
            "resource_id": maintenance_resource_id,
            "purpose": "Attempting to reserve equipment that is under maintenance.",
            **window,
        }
        resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert resp.status_code == 400
        assert "maintenance" in resp.json()["detail"].lower()


class TestEligibilityRequirements:
    def test_unverified_student_cannot_book_restricted_resource(
        self, client, student_token, verified_resource
    ):
        window = _future_window(offset_hours=160)
        payload = {
            "resource_id": verified_resource.id,
            "purpose": "Booking restricted asset without clearance should fail.",
            **window,
        }
        resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert resp.status_code == 403
        assert "clearance" in resp.json()["detail"].lower()

    def test_verified_student_can_book_restricted_resource(
        self, client, db_session, student_user, student_token, verified_resource
    ):
        # Give student a verified clearance record
        clearance = EligibilityVerification(
            user_id=student_user.id,
            resource_id=verified_resource.id,
            requirement_type=verified_resource.training_requirement or "Lab Safety",
            status=VerificationStatus.VERIFIED.value,
        )
        db_session.add(clearance)
        db_session.commit()

        try:
            window = _future_window(offset_hours=180)
            payload = {
                "resource_id": verified_resource.id,
                "purpose": "Authorized research project using verified safety clearance.",
                **window,
            }
            resp = client.post(
                "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
            )
            assert resp.status_code == 201
            assert resp.json()["status"] == "Pending"
        finally:
            db_session.delete(clearance)
            db_session.commit()


class TestOverlapAndConflictPrevention:
    def test_overlapping_reservations_detected_and_rejected(
        self, client, student_token, second_student_token, open_resource_id
    ):
        # Student 1 books hours 200 to 204
        start1 = datetime.now(timezone.utc) + timedelta(hours=200)
        end1 = start1 + timedelta(hours=4)
        payload1 = {
            "resource_id": open_resource_id,
            "start_at": start1.isoformat(),
            "end_at": end1.isoformat(),
            "purpose": "First reservation window for group experiment.",
        }
        resp1 = client.post(
            "/api/v1/requests", json=payload1, headers=_auth_headers(student_token)
        )
        assert resp1.status_code == 201

        # Student 2 tries overlapping window: hours 202 to 206 (overlaps by 2 hours)
        start2 = datetime.now(timezone.utc) + timedelta(hours=202)
        end2 = start2 + timedelta(hours=4)
        payload2 = {
            "resource_id": open_resource_id,
            "start_at": start2.isoformat(),
            "end_at": end2.isoformat(),
            "purpose": "Conflicting reservation window should be blocked.",
        }
        resp2 = client.post(
            "/api/v1/requests", json=payload2, headers=_auth_headers(second_student_token)
        )
        assert resp2.status_code == 409
        assert "conflicts" in resp2.json()["detail"].lower()


class TestGetMyReservations:
    def test_get_my_reservations_returns_list(self, client, student_token):
        resp = client.get("/api/v1/requests/me", headers=_auth_headers(student_token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_my_reservations_requires_auth(self, client):
        resp = client.get("/api/v1/requests/me")
        assert resp.status_code == 401


class TestOwnershipRestrictions:
    def test_student_cannot_view_others_reservation(
        self, client, student_token, second_student_token, open_resource_id
    ):
        window = _future_window(offset_hours=220)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Private research work by Student 1.",
            **window,
        }
        create_resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert create_resp.status_code == 201
        rid = create_resp.json()["id"]

        # Student 2 attempts to inspect Student 1's request
        view_resp = client.get(
            f"/api/v1/requests/{rid}", headers=_auth_headers(second_student_token)
        )
        assert view_resp.status_code == 403

    def test_student_cannot_cancel_others_reservation(
        self, client, student_token, second_student_token, open_resource_id
    ):
        window = _future_window(offset_hours=240)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Student 1 reservation to test cancel security.",
            **window,
        }
        create_resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert create_resp.status_code == 201
        rid = create_resp.json()["id"]

        cancel_resp = client.post(
            f"/api/v1/requests/{rid}/cancel", headers=_auth_headers(second_student_token)
        )
        assert cancel_resp.status_code == 403


class TestReviewQueue:
    def test_review_queue_accessible_by_custodian(self, client, custodian_token):
        resp = client.get(
            "/api/v1/requests/review-queue", headers=_auth_headers(custodian_token)
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_review_queue_forbidden_for_student(self, client, student_token):
        resp = client.get(
            "/api/v1/requests/review-queue", headers=_auth_headers(student_token)
        )
        assert resp.status_code == 403

    def test_review_queue_requires_auth(self, client):
        resp = client.get("/api/v1/requests/review-queue")
        assert resp.status_code == 401


class TestReviewReservation:
    def test_approve_reservation_sets_approved_at(
        self, client, student_token, custodian_token, open_resource_id
    ):
        window = _future_window(offset_hours=260)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Testing approval workflow and approved_at timestamp.",
            **window,
        }
        create_resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert create_resp.status_code == 201
        rid = create_resp.json()["id"]

        review_resp = client.patch(
            f"/api/v1/requests/{rid}/review",
            json={"status": "Approved", "review_notes": "Equipment allocated."},
            headers=_auth_headers(custodian_token),
        )
        assert review_resp.status_code == 200
        data = review_resp.json()
        assert data["status"] == "Approved"
        assert data["review_notes"] == "Equipment allocated."
        assert data["reviewed_at"] is not None
        assert data["approved_at"] is not None

    def test_reject_reservation(
        self, client, student_token, custodian_token, open_resource_id
    ):
        window = _future_window(offset_hours=280)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Testing rejection workflow with custodian notes.",
            **window,
        }
        create_resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert create_resp.status_code == 201
        rid = create_resp.json()["id"]

        review_resp = client.patch(
            f"/api/v1/requests/{rid}/review",
            json={"status": "Rejected", "review_notes": "Insufficient justification."},
            headers=_auth_headers(custodian_token),
        )
        assert review_resp.status_code == 200
        data = review_resp.json()
        assert data["status"] == "Rejected"
        assert data["reviewed_at"] is not None
        assert data["approved_at"] is None

    def test_self_review_forbidden(self, client, db_session, open_resource_id):
        self_reviewer = _make_user(db_session, "SelfReviewer", UserRole.CUSTODIAN.value)
        try:
            token = _login(client, self_reviewer.email)
            window = _future_window(offset_hours=300)
            payload = {
                "resource_id": open_resource_id,
                "purpose": "Self-review attempt must be blocked by service layer.",
                **window,
            }
            create_resp = client.post(
                "/api/v1/requests", json=payload, headers=_auth_headers(token)
            )
            assert create_resp.status_code == 201
            rid = create_resp.json()["id"]

            review_resp = client.patch(
                f"/api/v1/requests/{rid}/review",
                json={"status": "Approved"},
                headers=_auth_headers(token),
            )
            assert review_resp.status_code == 403
            assert "cannot review your own" in review_resp.json()["detail"].lower()
        finally:
            db_session.delete(self_reviewer)
            db_session.commit()


class TestCancelReservation:
    def test_cancel_pending_reservation(self, client, student_token, open_resource_id):
        window = _future_window(offset_hours=320)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Cancellation test — student cancels their pending request.",
            **window,
        }
        create_resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert create_resp.status_code == 201
        rid = create_resp.json()["id"]

        cancel_resp = client.post(
            f"/api/v1/requests/{rid}/cancel", headers=_auth_headers(student_token)
        )
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["status"] == "Cancelled"


class TestLifecycleAndTimestamps:
    def test_full_custody_lifecycle_with_timestamps(
        self, client, student_token, custodian_token, open_resource_id
    ):
        """
        Pending -> Approved -> Ready for Pickup -> Collected -> Return Pending -> Completed
        Verifies all timestamps (submitted_at, reviewed_at, approved_at, collected_at, returned_at).
        """
        window = _future_window(offset_hours=340)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Complete end-to-end custody tracking workflow verification.",
            **window,
        }

        # 1. Create
        r = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert r.status_code == 201
        rid = r.json()["id"]
        assert r.json()["status"] == "Pending"
        assert r.json()["submitted_at"] is not None

        # 2. Approve
        r = client.patch(
            f"/api/v1/requests/{rid}/review",
            json={"status": "Approved"},
            headers=_auth_headers(custodian_token),
        )
        assert r.status_code == 200
        assert r.json()["status"] == "Approved"
        assert r.json()["approved_at"] is not None

        # 3. Ready for pickup
        r = client.post(
            f"/api/v1/requests/{rid}/ready", headers=_auth_headers(custodian_token)
        )
        assert r.status_code == 200
        assert r.json()["status"] == "Ready for Pickup"

        # 4. Collected
        r = client.post(
            f"/api/v1/requests/{rid}/collect", headers=_auth_headers(custodian_token)
        )
        assert r.status_code == 200
        assert r.json()["status"] == "Collected"
        assert r.json()["collected_at"] is not None

        # 5. Return pending
        r = client.post(
            f"/api/v1/requests/{rid}/return", headers=_auth_headers(custodian_token)
        )
        assert r.status_code == 200
        assert r.json()["status"] == "Return Pending"
        assert r.json()["returned_at"] is not None

        # 6. Complete
        r = client.post(
            f"/api/v1/requests/{rid}/complete", headers=_auth_headers(custodian_token)
        )
        assert r.status_code == 200
        assert r.json()["status"] == "Completed"

    def test_invalid_lifecycle_transition_rejected(
        self, client, student_token, custodian_token, open_resource_id
    ):
        """Cannot jump directly from Pending to Collected without approval."""
        window = _future_window(offset_hours=360)
        payload = {
            "resource_id": open_resource_id,
            "purpose": "Testing illegal state transition rejection.",
            **window,
        }
        create_resp = client.post(
            "/api/v1/requests", json=payload, headers=_auth_headers(student_token)
        )
        assert create_resp.status_code == 201
        rid = create_resp.json()["id"]

        jump_resp = client.post(
            f"/api/v1/requests/{rid}/collect", headers=_auth_headers(custodian_token)
        )
        assert jump_resp.status_code == 409
        assert "cannot transition" in jump_resp.json()["detail"].lower()
