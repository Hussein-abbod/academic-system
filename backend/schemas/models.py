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


# ---------------------------------------------------------------------------
# Quiz Option schemas
# ---------------------------------------------------------------------------

class OptionCreate(BaseModel):
    """Schema for creating an answer option"""
    option_text: Optional[str] = None
    option_image_path: Optional[str] = None
    is_correct: bool = False
    order_index: int = 0


class OptionResponse(BaseModel):
    """Schema for returning an option (is_correct hidden for students)"""
    id: str
    option_text: Optional[str] = None
    option_image_path: Optional[str] = None
    order_index: int
    is_correct: Optional[bool] = None  # omitted in student view

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Quiz Question schemas
# ---------------------------------------------------------------------------

class QuestionCreate(BaseModel):
    """Schema for adding a question to a quiz"""
    question_type: str = "MCQ"       # MCQ | LISTENING | SHORT_ANSWER
    question_text: str
    audio_file_path: Optional[str] = None
    points: float = 1.0
    order_index: int = 0
    options: Optional[list[OptionCreate]] = None


class QuestionUpdate(BaseModel):
    """Schema for updating a question"""
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    audio_file_path: Optional[str] = None
    points: Optional[float] = None
    order_index: Optional[int] = None
    options: Optional[list[OptionCreate]] = None


class QuestionResponse(BaseModel):
    """Schema for returning a question"""
    id: str
    quiz_id: str
    question_type: str
    question_text: str
    audio_file_path: Optional[str] = None
    points: float
    order_index: int
    options: list[OptionResponse] = []

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Quiz schemas
# ---------------------------------------------------------------------------

class QuizCreate(BaseModel):
    """Schema for creating a quiz (header info)"""
    title: str
    description: Optional[str] = None
    quiz_type: str = "READING"
    course_id: str
    time_limit_minutes: Optional[int] = None
    max_attempts: int = 1
    open_date: Optional[datetime] = None
    close_date: Optional[datetime] = None


class QuizUpdate(BaseModel):
    """Schema for updating quiz settings"""
    title: Optional[str] = None
    description: Optional[str] = None
    quiz_type: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    max_attempts: Optional[int] = None
    open_date: Optional[datetime] = None
    close_date: Optional[datetime] = None


class QuizResponse(BaseModel):
    """Schema for returning a quiz (with or without questions)"""
    id: str
    course_id: str
    created_by: str
    title: str
    description: Optional[str] = None
    quiz_type: str
    status: str
    time_limit_minutes: Optional[int] = None
    max_attempts: int
    open_date: Optional[datetime] = None
    close_date: Optional[datetime] = None
    created_at: datetime
    questions: list[QuestionResponse] = []
    total_points: Optional[float] = None
    course_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Quiz Submission / Answer schemas
# ---------------------------------------------------------------------------

class AnswerSubmit(BaseModel):
    """One student answer inside a submission"""
    question_id: str
    selected_option_id: Optional[str] = None
    short_answer_text: Optional[str] = None


class SubmissionCreate(BaseModel):
    """Payload for submitting a quiz attempt"""
    answers: list[AnswerSubmit]


class AnswerResult(BaseModel):
    """Result for a single question after grading"""
    question_id: str
    question_text: str
    selected_option_id: Optional[str] = None
    is_correct: Optional[bool] = None
    points_awarded: float
    max_points: float

    class Config:
        from_attributes = True


class QuizResultResponse(BaseModel):
    """Full result returned after submitting a quiz"""
    submission_id: str
    quiz_id: str
    quiz_title: str
    score: float
    max_score: float
    percentage: float
    attempt_number: int
    submitted_at: Optional[datetime] = None
    answers: list[AnswerResult] = []

    class Config:
        from_attributes = True


class SubmissionSummary(BaseModel):
    """Summary of a student submission (for teacher results view)"""
    submission_id: str
    student_id: str
    student_name: str
    score: Optional[float] = None
    max_score: Optional[float] = None
    percentage: Optional[float] = None
    attempt_number: int
    submitted_at: Optional[datetime] = None
    status: str

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
