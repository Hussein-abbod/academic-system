from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.enrollment import Enrollment
from models.course import Course
from models.user import User
from schemas.models import EnrollmentResponse
from auth.dependencies import require_teacher, get_current_user

router = APIRouter(tags=["Teacher - Students"])

@router.get("/students", response_model=List[EnrollmentResponse])
async def get_my_students(
    course_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Get all students enrolled in courses taught by the current teacher.
    Optionally filter by course_id.
    """
    query = db.query(Enrollment).join(Course).filter(
        Course.teacher_id == current_user.id,
        Enrollment.status == "ACTIVE"
    )
    
    if course_id:
        query = query.filter(Course.id == course_id)
        
    enrollments = query.all()
    
    return [EnrollmentResponse.from_orm(enrollment) for enrollment in enrollments]
