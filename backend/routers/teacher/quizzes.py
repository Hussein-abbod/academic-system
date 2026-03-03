from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.course import Course
from models.quiz import Quiz
from models.user import User
from schemas.models import QuizCreate, QuizResponse, QuizUpdate
from auth.dependencies import require_teacher

router = APIRouter(tags=["Teacher - Quizzes"])

@router.post("/courses/{course_id}/quizzes", response_model=QuizResponse)
async def create_quiz(
    course_id: str,
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Create a new quiz for a course
    """
    # Verify course exists and belongs to teacher
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.teacher_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not assigned to you"
        )
    
    new_quiz = Quiz(
        course_id=course_id,
        title=quiz_data.title,
        description=quiz_data.description,
        quiz_type=quiz_data.quiz_type,
        link=quiz_data.link,
        due_date=quiz_data.due_date
    )
    
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    
    return QuizResponse.from_orm(new_quiz)

@router.get("/courses/{course_id}/quizzes", response_model=List[QuizResponse])
async def get_course_quizzes(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Get all quizzes for a course
    """
    # Verify course exists and belongs to teacher
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.teacher_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not assigned to you"
        )
    
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    return [QuizResponse.from_orm(quiz) for quiz in quizzes]

@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Delete a quiz
    """
    quiz = db.query(Quiz).join(Course).filter(
        Quiz.id == quiz_id,
        Course.teacher_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found or you don't have permission to delete it"
        )
    
    db.delete(quiz)
    db.commit()
