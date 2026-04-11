from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from models.user import UserRole


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str
    role: Optional[UserRole] = None


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: str
    role: UserRole
    full_name: str
    phone_number: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v
