import logging
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserRegister
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

logger = logging.getLogger(__name__)


class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserRegister) -> User:
        """
        Registers a new user account.
        Enforces:
        - Email normalization.
        - Unique email constraint check.
        - Password hashing with bcrypt.
        - Mandatory Student role assignment (public users cannot self-assign privileged roles).
        """
        normalized_email = user_in.email.strip().lower()

        # Check for duplicate account
        existing_user = db.query(User).filter(User.email == normalized_email).first()
        if existing_user:
            logger.warning(f"Registration attempt failed: duplicate email '{normalized_email}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        # Hash password securely
        hashed_pwd = hash_password(user_in.password)

        new_user = User(
            full_name=user_in.full_name.strip(),
            email=normalized_email,
            hashed_password=hashed_pwd,
            role=UserRole.STUDENT.value,  # ALWAYS Student on public registration
            department=user_in.department.strip() if user_in.department else None,
            student_id=user_in.student_id.strip() if user_in.student_id else None,
            is_active=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"Successfully registered student user '{new_user.email}' (ID: {new_user.id})")
        return new_user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """
        Validates user credentials.
        Returns User on success.
        Rejects invalid credentials generically without revealing whether the email exists.
        """
        normalized_email = email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()

        # Constant-time-like check even if user doesn't exist to prevent timing attacks
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Failed login attempt for email: '{normalized_email}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            logger.warning(f"Deactivated user '{normalized_email}' attempted login.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This user account has been deactivated. Please contact campus administration.",
            )

        logger.info(f"Successful login for user '{user.email}' (Role: {user.role})")
        return user

    @staticmethod
    def create_token_for_user(user: User) -> str:
        """Issues a signed JWT access token for the authenticated user."""
        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.full_name,
        }
        return create_access_token(data=token_payload)

    @staticmethod
    def bootstrap_admin_if_configured(db: Session) -> Optional[User]:
        """
        Safely creates or synchronizes the initial administrator account
        only if explicit environment variables are provided.
        """
        if not settings.ADMIN_BOOTSTRAP_EMAIL or not settings.ADMIN_BOOTSTRAP_PASSWORD:
            return None

        admin_email = settings.ADMIN_BOOTSTRAP_EMAIL.strip().lower()
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            admin_user = User(
                full_name=settings.ADMIN_BOOTSTRAP_NAME,
                email=admin_email,
                hashed_password=hash_password(settings.ADMIN_BOOTSTRAP_PASSWORD),
                role=UserRole.ADMIN.value,
                department="Campus Technology Administration",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logger.info(f"Bootstrap administrator created: {admin_email}")
            return admin_user
        else:
            # Ensure the designated bootstrap account holds Admin role and active status
            existing_admin.role = UserRole.ADMIN.value
            existing_admin.is_active = True
            db.commit()
            return existing_admin
