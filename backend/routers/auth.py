from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.auth import LoginRequest, LoginResponse, UserResponse, ProfileUpdate
from auth.security import verify_password, create_access_token, hash_password, get_upgraded_hash
from auth.dependencies import get_current_user
from config import settings
from limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Cookie settings — switch secure=True when running behind HTTPS in production
_COOKIE_ARGS = dict(
    key="access_token",
    httponly=True,
    samesite="none",        # Required for Cross-Origin (Frontend on Vercel, Backend on Render)
    secure=True,            # Always True for SameSite=None (Requires HTTPS)
    path="/",
    max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
)


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """Login with email, password, and role selection. Rate-limited to 5 attempts/minute."""
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if user.role != login_data.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User does not have {login_data.role} role",
        )

    # Transparently upgrade SHA-256 hash to bcrypt on first login after migration
    upgraded = get_upgraded_hash(login_data.password, user.hashed_password)
    if upgraded:
        user.hashed_password = upgraded
        db.commit()

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )

    # Set secure HttpOnly cookie so JS cannot read the token
    response.set_cookie(value=access_token, **_COOKIE_ARGS)

    return LoginResponse(
        access_token=access_token,   # Also returned in body for API clients
        user=UserResponse.from_orm(user),
    )


@router.post("/logout")
async def logout(response: Response):
    """Clear the auth cookie (log out)."""
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse.from_orm(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's profile (name, phone, password, email for admin)."""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name

    if hasattr(profile_data, "email") and profile_data.email is not None:
        if current_user.role.value != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can update email addresses."
            )
        if profile_data.email != current_user.email:
            existing_user = db.query(User).filter(User.email == profile_data.email, User.id != current_user.id).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already in use by another account."
                )
            current_user.email = profile_data.email

    if profile_data.phone_number is not None:
        current_user.phone_number = profile_data.phone_number

    if profile_data.new_password:
        if not profile_data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password",
            )
        if not verify_password(profile_data.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        current_user.hashed_password = hash_password(profile_data.new_password)

    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)
