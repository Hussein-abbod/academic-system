from pydantic import BaseModel
from typing import Optional
from datetime import date


class LevelCreate(BaseModel):
    """Schema for creating a level"""
    name: str
    description: Optional[str] = None
    order: int
    passing_score_requirement: int = 80


class LevelUpdate(BaseModel):
    """Schema for updating a level"""
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    passing_score_requirement: Optional[int] = None


class LevelResponse(BaseModel):
    """Schema for level response"""
    id: str
    name: str
    description: Optional[str] = None
    order: int
    passing_score_requirement: int
    
    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    """Schema for creating a course"""
    name: str
    description: Optional[str] = None
    level_id: str
    teacher_id: Optional[str] = None
    capacity: int = 20
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    price: float


class CourseUpdate(BaseModel):
    """Schema for updating a course"""
    name: Optional[str] = None
    description: Optional[str] = None
    level_id: Optional[str] = None
    teacher_id: Optional[str] = None
    capacity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None


class CourseResponse(BaseModel):
    """Schema for course response"""
    id: str
    name: str
    description: Optional[str] = None
    level_id: str
    teacher_id: Optional[str] = None
    capacity: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    price: float
    is_active: bool
    level: Optional[LevelResponse] = None
    
    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    """Schema for creating an enrollment"""
    student_id: str
    course_id: str


class EnrollmentUpdate(BaseModel):
    """Schema for updating an enrollment"""
    status: Optional[str] = None
    current_progress: Optional[float] = None


class EnrollmentResponse(BaseModel):
    """Schema for enrollment response"""
    id: str
    student_id: str
    course_id: str
    enrollment_date: str
    status: str
    current_progress: float
    
    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    """Schema for creating a payment"""
    enrollment_id: str
    amount: float
    payment_status: str = "PENDING"
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    """Schema for updating a payment"""
    amount: Optional[float] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    """Schema for payment response"""
    id: str
    enrollment_id: str
    amount: float
    payment_status: str
    payment_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True
