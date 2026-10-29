from datetime import timedelta
import pytest
from fastapi import status
from app.models.user import User, UserRole
from app.core.security import create_access_token, hash_password


def test_student_registration_success(client, db_session):
    """Verify successful student account creation with default Student role."""
    payload = {
        "full_name": "Marcus Wright",
        "email": "marcus.wright@university.edu",
        "password": "SecurePassword123!",
        "department": "Department of Electrical Engineering",
        "student_id": "EE-9912",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    user = data["user"]
    assert user["email"] == "marcus.wright@university.edu"
    assert user["role"] == UserRole.STUDENT.value
    assert "hashed_password" not in user

    # Verify password in DB is hashed and not stored in plaintext
    db_user = db_session.query(User).filter(User.email == "marcus.wright@university.edu").first()
    assert db_user is not None
    assert db_user.hashed_password != "SecurePassword123!"
    assert db_user.hashed_password.startswith("$2b$") or len(db_user.hashed_password) > 30


def test_public_registration_cannot_assign_privileged_role(client, db_session):
    """Ensure public registration cannot self-grant Admin or Custodian role."""
    payload = {
        "full_name": "Privilege Seeker",
        "email": "hacker@university.edu",
        "password": "Password123!",
        "role": "Admin",  # Attempt privilege escalation
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED

    # User must strictly be Student regardless of input
    user_data = response.json()["user"]
    assert user_data["role"] == UserRole.STUDENT.value

    db_user = db_session.query(User).filter(User.email == "hacker@university.edu").first()
    assert db_user.role == UserRole.STUDENT.value


def test_duplicate_email_registration_rejected(client):
    """Verify that registering with an existing email returns HTTP 400."""
    payload = {
        "full_name": "Duplicate User",
        "email": "marcus.wright@university.edu",  # Already registered above
        "password": "AnotherPassword456!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"].lower()


def test_successful_login(client):
    """Verify successful login returns valid JWT and user details."""
    payload = {
        "email": "marcus.wright@university.edu",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "marcus.wright@university.edu"


def test_login_wrong_password_rejected(client):
    """Verify invalid password returns generic HTTP 401."""
    payload = {
        "email": "marcus.wright@university.edu",
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorrect email or password" in response.json()["detail"].lower()


def test_login_nonexistent_email_rejected(client):
    """Verify nonexistent email returns generic HTTP 401 without user enumeration."""
    payload = {
        "email": "nonexistent.ghost@university.edu",
        "password": "SomePassword123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorrect email or password" in response.json()["detail"].lower()


def test_login_inactive_user_rejected(client, db_session):
    """Verify deactivated user accounts cannot log in."""
    inactive_user = User(
        full_name="Banned Student",
        email="banned@university.edu",
        hashed_password=hash_password("Pass123456!"),
        role=UserRole.STUDENT.value,
        is_active=False,
    )
    db_session.add(inactive_user)
    db_session.commit()

    payload = {
        "email": "banned@university.edu",
        "password": "Pass123456!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "deactivated" in response.json()["detail"].lower()


def test_get_me_without_token_returns_401(client):
    """Verify GET /api/v1/auth/me rejects unauthenticated requests."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_me_with_valid_token(client):
    """Verify GET /api/v1/auth/me returns safe profile for logged-in user."""
    # Login first
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "marcus.wright@university.edu", "password": "SecurePassword123!"},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    user = response.json()
    assert user["email"] == "marcus.wright@university.edu"
    assert user["full_name"] == "Marcus Wright"
    assert "hashed_password" not in user


def test_get_me_with_expired_token(client, db_session):
    """Verify expired token returns HTTP 401 with appropriate message."""
    user = db_session.query(User).filter(User.email == "marcus.wright@university.edu").first()
    expired_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(seconds=-10),  # expired 10s ago
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "expired" in response.json()["detail"].lower()


def test_get_me_with_malformed_token(client):
    """Verify malformed token is rejected."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.malformed.token"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_admin_rbac_and_role_management(client, db_session):
    """Verify Admin RBAC: Student cannot list users; Admin can update user roles."""
    # 1. Create an admin user directly
    admin_user = User(
        full_name="Lab Admin",
        email="super.admin@university.edu",
        hashed_password=hash_password("AdminPass123!"),
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db_session.add(admin_user)
    db_session.commit()

    admin_token = create_access_token({"sub": str(admin_user.id), "email": admin_user.email, "role": admin_user.role})

    # Student token
    student = db_session.query(User).filter(User.email == "marcus.wright@university.edu").first()
    student_token = create_access_token({"sub": str(student.id), "email": student.email, "role": student.role})

    # Student trying to access /auth/users -> 403 Forbidden
    res_student_denied = client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_student_denied.status_code == status.HTTP_403_FORBIDDEN

    # Admin accessing /auth/users -> 200 OK
    res_admin_ok = client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin_ok.status_code == status.HTTP_200_OK
    assert len(res_admin_ok.json()) >= 2

    # Admin promotes Student to Lab Custodian
    res_promote = client.patch(
        f"/api/v1/auth/users/{student.id}/role",
        json={"role": UserRole.CUSTODIAN.value},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_promote.status_code == status.HTTP_200_OK
    assert res_promote.json()["role"] == UserRole.CUSTODIAN.value

    # Verify student is now Lab Custodian in DB
    db_session.refresh(student)
    assert student.role == UserRole.CUSTODIAN.value
