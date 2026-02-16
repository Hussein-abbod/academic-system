from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.enrollment import Enrollment
from schemas.models import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse
from auth.dependencies import require_admin

router = APIRouter(prefix="/admin/enrollments", tags=["Admin - Enrollments"])


@router.post("", response_model=EnrollmentResponse, dependencies=[Depends(require_admin)])
async def create_enrollment(enrollment_data: EnrollmentCreate, db: Session = Depends(get_db)):
    """Enroll a student in a course"""
    new_enrollment = Enrollment(**enrollment_data.dict())
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)
    
    return EnrollmentResponse.from_orm(new_enrollment)


@router.get("", response_model=List[EnrollmentResponse], dependencies=[Depends(require_admin)])
async def list_enrollments(
    student_id: str = None,
    course_id: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all enrollments with optional filtering"""
    query = db.query(Enrollment)
    
    if student_id:
        query = query.filter(Enrollment.student_id == student_id)
    if course_id:
        query = query.filter(Enrollment.course_id == course_id)
    if status:
        query = query.filter(Enrollment.status == status)
    
    enrollments = query.offset(skip).limit(limit).all()
    return [EnrollmentResponse.from_orm(enrollment) for enrollment in enrollments]


@router.get("/{enrollment_id}", response_model=EnrollmentResponse, dependencies=[Depends(require_admin)])
async def get_enrollment(enrollment_id: str, db: Session = Depends(get_db)):
    """Get enrollment details by ID"""
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    return EnrollmentResponse.from_orm(enrollment)


@router.put("/{enrollment_id}", response_model=EnrollmentResponse, dependencies=[Depends(require_admin)])
async def update_enrollment(enrollment_id: str, enrollment_data: EnrollmentUpdate, db: Session = Depends(get_db)):
    """Update enrollment status or progress"""
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    # Update fields
    update_data = enrollment_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(enrollment, field, value)
    
    db.commit()
    db.refresh(enrollment)
    
    return EnrollmentResponse.from_orm(enrollment)


@router.delete("/{enrollment_id}", dependencies=[Depends(require_admin)])
async def delete_enrollment(enrollment_id: str, db: Session = Depends(get_db)):
    """Delete an enrollment"""
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    db.delete(enrollment)
    db.commit()
    
    return {"message": "Enrollment deleted successfully"}
