from pydantic import BaseModel, EmailStr
from typing import Optional
from models.user import UserRole


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str
    role: UserRole


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
