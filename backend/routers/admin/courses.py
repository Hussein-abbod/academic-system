from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.course import Course
from schemas.models import CourseCreate, CourseUpdate, CourseResponse
from auth.dependencies import require_admin

router = APIRouter(prefix="/admin/courses", tags=["Admin - Courses"])


@router.post("", response_model=CourseResponse, dependencies=[Depends(require_admin)])
async def create_course(course_data: CourseCreate, db: Session = Depends(get_db)):
    """Create a new course"""
    new_course = Course(**course_data.dict())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return CourseResponse.from_orm(new_course)


@router.get("", response_model=List[CourseResponse], dependencies=[Depends(require_admin)])
async def list_courses(
    is_active: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all courses with optional filtering"""
    query = db.query(Course)
    
    if is_active is not None:
        query = query.filter(Course.is_active == is_active)
    
    courses = query.offset(skip).limit(limit).all()
    return [CourseResponse.from_orm(course) for course in courses]


@router.get("/{course_id}", response_model=CourseResponse, dependencies=[Depends(require_admin)])
async def get_course(course_id: str, db: Session = Depends(get_db)):
    """Get course details by ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return CourseResponse.from_orm(course)


@router.put("/{course_id}", response_model=CourseResponse, dependencies=[Depends(require_admin)])
async def update_course(course_id: str, course_data: CourseUpdate, db: Session = Depends(get_db)):
    """Update course information"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Update fields
    update_data = course_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    db.commit()
    db.refresh(course)
    
    return CourseResponse.from_orm(course)


@router.delete("/{course_id}", dependencies=[Depends(require_admin)])
async def delete_course(course_id: str, db: Session = Depends(get_db)):
    """Delete a course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}
