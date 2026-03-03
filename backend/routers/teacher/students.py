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
        Course.teacher_id == current_user.id
    )
    
    if course_id:
        query = query.filter(Enrollment.course_id == course_id)
        
    enrollments = query.all()
    
    results = []
    for enrollment in enrollments:
        resp = EnrollmentResponse.from_orm(enrollment)
        
        # Manually fetch student if needed
        if not enrollment.student:
            student = db.query(User).filter(User.id == enrollment.student_id).first()
            if student:
                resp.student_name = student.full_name
                resp.student_email = student.email
        else:
            resp.student_name = enrollment.student.full_name
            resp.student_email = enrollment.student.email
            
        if enrollment.course:
            resp.course_name = enrollment.course.name
            resp.course_price = float(enrollment.course.price) if enrollment.course.price else 0.0
        else:
            course = db.query(Course).filter(Course.id == enrollment.course_id).first()
            if course:
                resp.course_name = course.name
                resp.course_price = float(course.price) if course.price else 0.0
            
        results.append(resp)
            
    return results
