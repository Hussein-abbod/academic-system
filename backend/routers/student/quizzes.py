from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.course import Course
from models.quiz import Quiz
from models.enrollment import Enrollment, EnrollmentStatus
from models.user import User
from schemas.models import QuizResponse
from auth.dependencies import require_student

router = APIRouter(tags=["Student - Quizzes"])

@router.get("/courses/{course_id}/quizzes", response_model=List[QuizResponse])
async def get_my_course_quizzes(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Get all quizzes for a course the student is enrolled in
    """
    # Verify enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == EnrollmentStatus.ACTIVE
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course"
        )
    
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    return [QuizResponse.from_orm(quiz) for quiz in quizzes]
