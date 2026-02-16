from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.course import Course
from models.user import User
from schemas.models import CourseResponse
from auth.dependencies import require_teacher, get_current_user

router = APIRouter(tags=["Teacher - Courses"])

@router.get("/courses", response_model=List[CourseResponse])
async def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Get all courses assigned to the current teacher
    """
    courses = db.query(Course).filter(
        Course.teacher_id == current_user.id,
        Course.is_active == True
    ).all()
    
    return [CourseResponse.from_orm(course) for course in courses]

@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_my_course_details(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Get details of a specific course assigned to the current teacher
    """
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.teacher_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not assigned to you"
        )
    
    return CourseResponse.from_orm(course)
