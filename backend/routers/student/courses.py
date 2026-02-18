from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.enrollment import Enrollment
from models.user import User
from schemas.models import EnrollmentResponse
from auth.dependencies import require_student

router = APIRouter(tags=["Student - Courses"])

@router.get("/courses")
async def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Get all courses the current student is enrolled in
    """
    from sqlalchemy.orm import joinedload
    from models.course import Course
    
    enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.course)
    ).filter(
        Enrollment.student_id == current_user.id
    ).all()
    
    results = []
    for enrollment in enrollments:
        # Create dictionary manually to ensure safe serialization
        enrollment_dict = {
            "id": str(enrollment.id),
            "student_id": str(enrollment.student_id),
            "course_id": str(enrollment.course_id),
            "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
            "status": str(enrollment.status.value) if hasattr(enrollment.status, 'value') else str(enrollment.status),
            "current_progress": float(enrollment.current_progress or 0.0),
            "course_name": "Unknown Course",
            "course_price": 0.0
        }
        
        if enrollment.course:
            enrollment_dict["course_name"] = enrollment.course.name
            enrollment_dict["course_price"] = float(enrollment.course.price) if enrollment.course.price is not None else 0.0
            
        results.append(enrollment_dict)
        
    return results
