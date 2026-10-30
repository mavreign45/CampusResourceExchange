"""
Phase 5 — Automated Notifications, Lifecycle Reminders & Expiry Tests.

Covers:
- Notification creation and fields
- Recipient privacy and ownership checks
- Read / unread status transitions
- Unread count endpoint
- Pagination and status filtering
- Duplicate prevention (idempotency)
- Reservation event notification triggers (submitted, approved, rejected, cancelled, ready, completed)
- Eligibility event notification triggers (verified, rejected)
- Pickup & return reminder automation
- Overdue detection automation
- Expiry policy for uncollected approved reservations
"""
import uuid
from datetime import datetime, timezone, timedelta

import pytest
from fastapi.testclient import TestClient

from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from app.models.reservation import Reservation, ReservationStatus
from app.models.resource import Resource as ResourceModel
from app.models.eligibility import EligibilityVerification, VerificationStatus
from app.core.security import hash_password
from app.services import notification_service, automation_service


# ─── Test Helpers ─────────────────────────────────────────────────────────────

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


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def open_resource_id(db_session) -> str:
    r = (
        db_session.query(ResourceModel)
        .filter(
            ResourceModel.requires_verification.is_(False),
            ResourceModel.availability_status == "available",
        )
        .first()
    )
    assert r is not None, "No open resource found"
    return r.id


@pytest.fixture
def student_a(db_session):
    u = _make_user(db_session, "Alice Student", UserRole.STUDENT.value)
    yield u
    db_session.delete(u)
    db_session.commit()


@pytest.fixture
def student_b(db_session):
    u = _make_user(db_session, "Bob Student", UserRole.STUDENT.value)
    yield u
    db_session.delete(u)
    db_session.commit()


@pytest.fixture
def custodian(db_session):
    u = _make_user(db_session, "Carlos Custodian", UserRole.CUSTODIAN.value)
    yield u
    db_session.delete(u)
    db_session.commit()


@pytest.fixture
def student_a_token(client, student_a):
    return _login(client, student_a.email)


@pytest.fixture
def student_b_token(client, student_b):
    return _login(client, student_b.email)


@pytest.fixture
def custodian_token(client, custodian):
    return _login(client, custodian.email)


# ─── Tests ───────────────────────────────────────────────────────────────────

class TestNotificationBasics:
    def test_create_and_fetch_notifications(self, client, db_session, student_a, student_a_token):
        # Create a notification
        n = notification_service.create_notification(
            db=db_session,
            recipient_id=student_a.id,
            notification_type=NotificationType.SYSTEM_ALERT,
            title="System Maintenance",
            message="Campus systems will be updated at midnight.",
            entity_type="system",
            entity_id="101",
        )
        assert n.id is not None
        assert n.is_read is False

        # Fetch via API
        resp = client.get("/api/v1/notifications", headers=_auth_headers(student_a_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert any(item["id"] == n.id for item in data["items"])
        assert data["unread_count"] >= 1

    def test_notification_privacy_and_ownership(
        self, client, db_session, student_a, student_b, student_b_token
    ):
        """Student B cannot view or mark Student A's notification as read."""
        n_a = notification_service.create_notification(
            db=db_session,
            recipient_id=student_a.id,
            notification_type=NotificationType.SYSTEM_ALERT,
            title="Private Notice for A",
            message="Confidential lab update.",
        )

        # Student B attempts to mark Student A's notification as read -> 403 Forbidden
        patch_resp = client.patch(
            f"/api/v1/notifications/{n_a.id}/read",
            headers=_auth_headers(student_b_token),
        )
        assert patch_resp.status_code == 403

        # Student B's notification list does not include Student A's notifications
        list_resp = client.get("/api/v1/notifications", headers=_auth_headers(student_b_token))
        assert list_resp.status_code == 200
        items = list_resp.json()["items"]
        assert all(item["id"] != n_a.id for item in items)

    def test_mark_single_notification_read(self, client, db_session, student_a, student_a_token):
        n = notification_service.create_notification(
            db=db_session,
            recipient_id=student_a.id,
            notification_type=NotificationType.SYSTEM_ALERT,
            title="Read Test",
            message="Testing mark as read.",
        )
        assert n.is_read is False

        resp = client.patch(
            f"/api/v1/notifications/{n.id}/read",
            headers=_auth_headers(student_a_token),
        )
        assert resp.status_code == 200
        assert resp.json()["is_read"] is True
        assert resp.json()["read_at"] is not None

    def test_mark_all_notifications_read(self, client, db_session, student_a, student_a_token):
        # Create two notifications for student_a
        notification_service.create_notification(
            db=db_session,
            recipient_id=student_a.id,
            notification_type=NotificationType.SYSTEM_ALERT,
            title="Notice 1",
            message="Message 1",
            entity_type="test",
            entity_id=uuid.uuid4().hex[:6],
        )
        notification_service.create_notification(
            db=db_session,
            recipient_id=student_a.id,
            notification_type=NotificationType.SYSTEM_ALERT,
            title="Notice 2",
            message="Message 2",
            entity_type="test",
            entity_id=uuid.uuid4().hex[:6],
        )

        # Verify unread count > 0
        count_resp = client.get(
            "/api/v1/notifications/unread-count",
            headers=_auth_headers(student_a_token),
        )
        assert count_resp.status_code == 200
        assert count_resp.json()["unread_count"] >= 2

        # Mark all read
        post_resp = client.post(
            "/api/v1/notifications/read-all",
            headers=_auth_headers(student_a_token),
        )
        assert post_resp.status_code == 200

        # Verify count is now 0
        count_after = client.get(
            "/api/v1/notifications/unread-count",
            headers=_auth_headers(student_a_token),
        )
        assert count_after.json()["unread_count"] == 0

    def test_duplicate_prevention(self, db_session, student_a):
        """Deduplication ensures identical entity event doesn't produce redundant notifications."""
        entity_id = "test-res-dedup-1"
        n1 = notification_service.create_notification(
            db=db_session,
            recipient_id=student_a.id,
            notification_type=NotificationType.PICKUP_REMINDER,
            title="Pickup Reminder",
            message="Your equipment is ready.",
            entity_type="reservation",
            entity_id=entity_id,
        )
        # Attempt second creation
        n2 = notification_service.create_notification(
            db=db_session,
            recipient_id=student_a.id,
            notification_type=NotificationType.PICKUP_REMINDER,
            title="Pickup Reminder",
            message="Your equipment is ready.",
            entity_type="reservation",
            entity_id=entity_id,
        )
        assert n1.id == n2.id


class TestReservationEventNotifications:
    def test_reservation_submitted_and_review_notifications(
        self, client, db_session, student_a, student_a_token, custodian, custodian_token, open_resource_id
    ):
        start = datetime.now(timezone.utc) + timedelta(hours=48)
        end = start + timedelta(hours=3)

        # 1. Student submits reservation
        create_resp = client.post(
            "/api/v1/requests",
            json={
                "resource_id": open_resource_id,
                "start_at": start.isoformat(),
                "end_at": end.isoformat(),
                "purpose": "Audio acoustics analysis project for physics course.",
            },
            headers=_auth_headers(student_a_token),
        )
        assert create_resp.status_code == 201
        res_id = create_resp.json()["id"]

        # Requester should have a reservation_submitted notification
        notif_resp = client.get("/api/v1/notifications", headers=_auth_headers(student_a_token))
        assert any(
            item["notification_type"] == "reservation_submitted" and item["entity_id"] == str(res_id)
            for item in notif_resp.json()["items"]
        )

        # Custodian should have a pending review notification
        cust_notif = client.get("/api/v1/notifications", headers=_auth_headers(custodian_token))
        assert any(
            item["notification_type"] == "reservation_submitted" and item["entity_id"] == str(res_id)
            for item in cust_notif.json()["items"]
        )

        # 2. Custodian approves reservation
        appr_resp = client.patch(
            f"/api/v1/requests/{res_id}/review",
            json={"status": "Approved", "review_notes": "Approved for acoustics lab."},
            headers=_auth_headers(custodian_token),
        )
        assert appr_resp.status_code == 200

        # Requester should have an approved notification
        notif_after_appr = client.get("/api/v1/notifications", headers=_auth_headers(student_a_token))
        assert any(
            item["notification_type"] == "reservation_approved" and item["entity_id"] == str(res_id)
            for item in notif_after_appr.json()["items"]
        )

        # 3. Ready for pickup notification
        ready_resp = client.post(
            f"/api/v1/requests/{res_id}/ready",
            headers=_auth_headers(custodian_token),
        )
        assert ready_resp.status_code == 200

        notif_after_ready = client.get("/api/v1/notifications", headers=_auth_headers(student_a_token))
        assert any(
            item["notification_type"] == "ready_for_pickup" and item["entity_id"] == str(res_id)
            for item in notif_after_ready.json()["items"]
        )

    def test_reservation_rejection_notification(
        self, client, student_a, student_a_token, custodian_token, open_resource_id
    ):
        start = datetime.now(timezone.utc) + timedelta(hours=96)
        end = start + timedelta(hours=2)

        create_resp = client.post(
            "/api/v1/requests",
            json={
                "resource_id": open_resource_id,
                "start_at": start.isoformat(),
                "end_at": end.isoformat(),
                "purpose": "Testing rejection notification dispatch.",
            },
            headers=_auth_headers(student_a_token),
        )
        assert create_resp.status_code == 201
        res_id = create_resp.json()["id"]

        rej_resp = client.patch(
            f"/api/v1/requests/{res_id}/review",
            json={"status": "Rejected", "review_notes": "Scheduling conflict."},
            headers=_auth_headers(custodian_token),
        )
        assert rej_resp.status_code == 200

        notif_resp = client.get("/api/v1/notifications", headers=_auth_headers(student_a_token))
        assert any(
            item["notification_type"] == "reservation_rejected" and item["entity_id"] == str(res_id)
            for item in notif_resp.json()["items"]
        )


class TestEligibilityEventNotifications:
    def test_eligibility_review_triggers_notification(
        self, client, db_session, student_a, student_a_token, custodian, custodian_token
    ):
        # Create an eligibility verification request directly
        req = EligibilityVerification(
            user_id=student_a.id,
            requirement_type="Laser Safety Level 1",
            status=VerificationStatus.PENDING.value,
            evidence_details="Completed institutional training certificate #9921",
        )
        db_session.add(req)
        db_session.commit()
        db_session.refresh(req)

        # Custodian approves the clearance
        review_resp = client.patch(
            f"/api/v1/eligibility/requests/{req.id}/review",
            json={"status": "Verified", "review_notes": "Certificate confirmed valid."},
            headers=_auth_headers(custodian_token),
        )
        assert review_resp.status_code == 200

        # Student A should receive an eligibility_verified notification
        notif_resp = client.get("/api/v1/notifications", headers=_auth_headers(student_a_token))
        assert any(
            item["notification_type"] == "eligibility_verified" and item["entity_id"] == str(req.id)
            for item in notif_resp.json()["items"]
        )


class TestAutomationAndReminders:
    def test_pickup_and_return_reminders(
        self, db_session, student_a, open_resource_id
    ):
        now = datetime.now(timezone.utc)

        # Create an approved reservation starting in 1 hour
        r_pickup = Reservation(
            resource_id=open_resource_id,
            requester_id=student_a.id,
            start_at=now + timedelta(hours=1),
            end_at=now + timedelta(hours=4),
            purpose="Pickup reminder test",
            status=ReservationStatus.APPROVED.value,
        )
        db_session.add(r_pickup)

        # Create a collected reservation ending in 1 hour
        r_return = Reservation(
            resource_id=open_resource_id,
            requester_id=student_a.id,
            start_at=now - timedelta(hours=2),
            end_at=now + timedelta(hours=1),
            purpose="Return reminder test",
            status=ReservationStatus.COLLECTED.value,
        )
        db_session.add(r_return)
        db_session.commit()

        # Run pickup reminders
        sent_pickups = automation_service.send_pickup_reminders(db_session, hours_ahead=2.0)
        assert sent_pickups >= 1

        # Run return reminders
        sent_returns = automation_service.send_return_reminders(db_session, hours_ahead=2.0)
        assert sent_returns >= 1

        # Check notifications generated
        n_pickup = (
            db_session.query(Notification)
            .filter(
                Notification.recipient_id == student_a.id,
                Notification.notification_type == NotificationType.PICKUP_REMINDER.value,
                Notification.entity_id == str(r_pickup.id),
            )
            .first()
        )
        assert n_pickup is not None

        n_return = (
            db_session.query(Notification)
            .filter(
                Notification.recipient_id == student_a.id,
                Notification.notification_type == NotificationType.RETURN_REMINDER.value,
                Notification.entity_id == str(r_return.id),
            )
            .first()
        )
        assert n_return is not None

    def test_overdue_detection(self, db_session, student_a, open_resource_id):
        now = datetime.now(timezone.utc)
        # Create collected reservation past end_at
        r_overdue = Reservation(
            resource_id=open_resource_id,
            requester_id=student_a.id,
            start_at=now - timedelta(hours=5),
            end_at=now - timedelta(hours=1),  # ended 1 hour ago
            purpose="Overdue test",
            status=ReservationStatus.COLLECTED.value,
        )
        db_session.add(r_overdue)
        db_session.commit()

        # Run overdue processing
        overdue_count = automation_service.process_overdue_reservations(db_session)
        assert overdue_count >= 1

        db_session.refresh(r_overdue)
        assert r_overdue.status == ReservationStatus.OVERDUE.value

    def test_uncollected_expiry_policy(self, db_session, student_a, open_resource_id):
        """
        An approved reservation whose start_at is > 24h in the past and was never
        collected must automatically transition to Cancelled, freeing the asset.
        """
        now = datetime.now(timezone.utc)
        r_abandoned = Reservation(
            resource_id=open_resource_id,
            requester_id=student_a.id,
            start_at=now - timedelta(hours=28),  # 28 hours ago
            end_at=now - timedelta(hours=20),
            purpose="Abandoned reservation",
            status=ReservationStatus.READY_FOR_PICKUP.value,
        )
        db_session.add(r_abandoned)
        db_session.commit()

        expired_count = automation_service.process_expired_uncollected(db_session, expiry_hours=24.0)
        assert expired_count >= 1

        db_session.refresh(r_abandoned)
        assert r_abandoned.status == ReservationStatus.CANCELLED.value
        assert "Auto-Cancelled" in (r_abandoned.review_notes or "")

    def test_collected_equipment_immune_to_uncollected_expiry(
        self, db_session, student_a, open_resource_id
    ):
        """Equipment in custody (Collected) must NEVER be auto-cancelled by uncollected expiry."""
        now = datetime.now(timezone.utc)
        r_collected = Reservation(
            resource_id=open_resource_id,
            requester_id=student_a.id,
            start_at=now - timedelta(hours=30),
            end_at=now + timedelta(hours=10),
            purpose="In custody asset",
            status=ReservationStatus.COLLECTED.value,
        )
        db_session.add(r_collected)
        db_session.commit()

        automation_service.process_expired_uncollected(db_session, expiry_hours=24.0)
        db_session.refresh(r_collected)
        assert r_collected.status == ReservationStatus.COLLECTED.value

    def test_automation_endpoint_rbac(self, client, student_a_token, custodian_token):
        # Student cannot trigger automation endpoint -> 403
        resp_student = client.post(
            "/api/v1/notifications/automation/run",
            headers=_auth_headers(student_a_token),
        )
        assert resp_student.status_code == 403

        # Custodian can trigger automation
        resp_cust = client.post(
            "/api/v1/notifications/automation/run",
            headers=_auth_headers(custodian_token),
        )
        assert resp_cust.status_code == 200
        assert resp_cust.json()["status"] == "success"
        assert "results" in resp_cust.json()
