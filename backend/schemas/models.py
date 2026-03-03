from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime





class CourseCreate(BaseModel):
    """Schema for creating a course"""
    name: str
    description: Optional[str] = None
    teacher_id: Optional[str] = None
    capacity: int = 20
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    price: float


class CourseUpdate(BaseModel):
    """Schema for updating a course"""
    name: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[str] = None
    capacity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None


class CourseResponse(BaseModel):
    """Schema for course response"""
    id: str
    name: str
    description: Optional[str] = None
    teacher_id: Optional[str] = None
    capacity: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    price: float
    is_active: bool
    
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
    enrollment_date: datetime
    status: str
    current_progress: float
    course_name: Optional[str] = None
    course_price: Optional[float] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    
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
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    course_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class QuizCreate(BaseModel):
    """Schema for creating a quiz"""
    title: str
    description: Optional[str] = None
    quiz_type: str
    link: str
    due_date: Optional[datetime] = None


class QuizUpdate(BaseModel):
    """Schema for updating a quiz"""
    title: Optional[str] = None
    description: Optional[str] = None
    quiz_type: Optional[str] = None
    link: Optional[str] = None
    due_date: Optional[datetime] = None


class QuizResponse(BaseModel):
    """Schema for quiz response"""
    id: str
    course_id: str
    title: str
    description: Optional[str] = None
    quiz_type: str
    link: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    """Schema for creating attendance record"""
    course_id: str
    student_id: str
    status: str
    date: Optional[str] = None  # ISO date string e.g. '2026-03-03'; parsed in the route handler
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    """Schema for updating attendance record"""
    status: Optional[str] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    """Schema for attendance response"""
    id: str
    course_id: str
    student_id: str
    date: date
    status: str
    notes: Optional[str] = None
    student_name: Optional[str] = None
    
    class Config:
        from_attributes = True
