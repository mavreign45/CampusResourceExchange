import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserRead,
    UserRoleUpdate,
    TokenResponse,
)
from app.services.auth_service import AuthService
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account",
    description="Public registration endpoint. Automatically and strictly assigns the Student role.",
)
def register(
    user_in: UserRegister,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = AuthService.register_user(db=db, user_in=user_in)
    access_token = AuthService.create_token_for_user(user)

    # Set HttpOnly cookie for browsers supporting credentialed requests
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT token",
    description="Validates user email and password, returning a signed JWT access token and user profile.",
)
def login(
    credentials: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = AuthService.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password,
    )
    access_token = AuthService.create_token_for_user(user)

    # Set HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get current authenticated user profile",
    description="Returns the safe profile of the currently logged-in user. Never exposes password hashes.",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserRead:
    return UserRead.model_validate(current_user)


@router.post(
    "/logout",
    summary="Log out of session",
    description="Clears session authentication cookies.",
)
def logout(response: Response) -> dict:
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
    )
    return {"message": "Successfully logged out of Campus Resource Exchange."}


# -------------------------------------------------------------------
# Administrative RBAC User Management Endpoints
# -------------------------------------------------------------------

@router.get(
    "/users",
    response_model=List[UserRead],
    summary="List all users (Admin only)",
    description="Allows administrators to audit user accounts, statuses, and assigned campus roles.",
)
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> List[UserRead]:
    users = db.query(User).order_by(User.id.asc()).all()
    return [UserRead.model_validate(u) for u in users]


@router.patch(
    "/users/{user_id}/role",
    response_model=UserRead,
    summary="Update user role or active status (Admin only)",
    description="Allows administrators to grant privileged roles (Faculty Researcher, Lab Custodian, Admin) or deactivate accounts.",
)
def update_user_role(
    user_id: int,
    update_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> UserRead:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found.",
        )

    # Protect against self-deactivation or self-demotion
    if user.id == admin_user.id and update_in.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot demote their own account role.",
        )

    user.role = update_in.role.value
    if update_in.is_active is not None:
        user.is_active = update_in.is_active

    db.commit()
    db.refresh(user)
    logger.info(f"Admin '{admin_user.email}' updated User ID {user.id} role to '{user.role}'")
    return UserRead.model_validate(user)
