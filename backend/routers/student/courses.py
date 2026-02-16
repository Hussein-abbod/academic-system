from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.enrollment import Enrollment
from models.user import User
from schemas.models import EnrollmentResponse
from auth.dependencies import require_student

router = APIRouter(tags=["Student - Courses"])

@router.get("/courses", response_model=List[EnrollmentResponse])
async def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Get all courses the current student is enrolled in
    """
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id
    ).all()
    
    return [EnrollmentResponse.from_orm(enrollment) for enrollment in enrollments]
