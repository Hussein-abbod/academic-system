from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.course import Course
from models.attendance import Attendance, AttendanceStatus
from models.enrollment import Enrollment  # To verify student is in course
from models.user import User
from schemas.models import AttendanceCreate, AttendanceResponse, AttendanceUpdate
from auth.dependencies import require_teacher
from datetime import date

router = APIRouter(tags=["Teacher - Attendance"])

@router.post("/attendance", response_model=AttendanceResponse)
async def take_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Record attendance for a student
    """
    # Verify course belongs to teacher
    course = db.query(Course).filter(
        Course.id == attendance_data.course_id, # Wait, AttendanceCreate doesn't have course_id in the schema I defined above?
        # Ah, I missed adding course_id to AttendanceCreate schema. I should fix that or pass it as path param.
        # But wait, looking at my schema definition:
        # class AttendanceCreate(BaseModel):
        #    student_id: str
        #    status: str
        #    date: Optional[date] = None
        #    notes: Optional[str] = None
        # It's missing course_id! I need to fix the schema first or pass it in URL.
        # I'll adding course_id to the schema for simplicity in bulk operations later, 
        # but for now I'll check my schema again.
        Course.teacher_id == current_user.id
    ).first()
    
    # ... wait I need to check the schema again. 
    # If I forgot course_id in AttendanceCreate, I need to add it.
