from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.attendance import Attendance
from models.enrollment import Enrollment, EnrollmentStatus
from models.user import User
from schemas.models import AttendanceResponse
from auth.dependencies import require_student

router = APIRouter(tags=["Student - Attendance"])

@router.get("/courses/{course_id}/attendance", response_model=List[AttendanceResponse])
async def get_my_course_attendance(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Get attendance records for a course the student is enrolled in
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
    
    records = db.query(Attendance).filter(
        Attendance.course_id == course_id,
        Attendance.student_id == current_user.id
    ).all()
    
    return [AttendanceResponse.from_orm(record) for record in records]
