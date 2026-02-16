from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.enrollment import Enrollment
from models.course import Course
from models.user import User
from auth.dependencies import require_student

router = APIRouter(tags=["Student - Dashboard"])

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Get dashboard statistics for the current student
    """
    # Get all enrollments
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id
    ).all()
    
    total_courses = len(enrollments)
    active_courses = sum(1 for e in enrollments if e.status == "ACTIVE")
    completed_courses = sum(1 for e in enrollments if e.status == "COMPLETED")
    
    # Calculate average progress (only for active courses to avoid skewing)
    active_enrollments = [e for e in enrollments if e.status == "ACTIVE"]
    avg_progress = 0
    if active_enrollments:
        avg_progress = sum(e.current_progress for e in active_enrollments) / len(active_enrollments)
        
    return {
        "total_courses": total_courses,
        "active_courses": active_courses,
        "completed_courses": completed_courses,
        "average_progress": round(avg_progress, 1)
    }
