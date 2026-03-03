from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.auth import LoginRequest, LoginResponse, UserResponse, ProfileUpdate
from auth.security import verify_password, create_access_token, hash_password
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email, password, and role selection"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if user.role != login_data.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User does not have {login_data.role} role"
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse.from_orm(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the current user's profile (name, phone, password)"""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name

    if profile_data.phone_number is not None:
        current_user.phone_number = profile_data.phone_number

    if profile_data.new_password:
        if not profile_data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password"
            )
        if not verify_password(profile_data.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        current_user.hashed_password = hash_password(profile_data.new_password)

    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)
