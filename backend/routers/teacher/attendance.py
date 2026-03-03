from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.course import Course
from models.attendance import Attendance, AttendanceStatus
from models.enrollment import Enrollment
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
        Course.id == attendance_data.course_id,
        Course.teacher_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not assigned to you"
        )
    
    # Check if student is enrolled
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == attendance_data.course_id,
        Enrollment.student_id == attendance_data.student_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is not enrolled in this course"
        )
        
    # Parse date: accept ISO string from frontend or fall back to today
    if attendance_data.date:
        try:
            from dateutil.parser import parse as parse_date
            attendance_date = parse_date(attendance_data.date).date()
        except Exception:
            attendance_date = date.today()
    else:
        attendance_date = date.today()

    existing_record = db.query(Attendance).filter(
        Attendance.course_id == attendance_data.course_id,
        Attendance.student_id == attendance_data.student_id,
        Attendance.date == attendance_date
    ).first()
    
    # Convert string status to enum member
    try:
        attendance_status = AttendanceStatus[attendance_data.status.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{attendance_data.status}'. Must be one of: {[s.value for s in AttendanceStatus]}"
        )

    if existing_record:
        # Update existing record
        existing_record.status = attendance_status
        existing_record.notes = attendance_data.notes
        db.commit()
        db.refresh(existing_record)
        return AttendanceResponse.from_orm(existing_record)
    
    new_attendance = Attendance(
        course_id=attendance_data.course_id,
        student_id=attendance_data.student_id,
        date=attendance_date,
        status=attendance_status,
        notes=attendance_data.notes
    )
    
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    
    return AttendanceResponse.from_orm(new_attendance)

@router.get("/courses/{course_id}/attendance", response_model=List[AttendanceResponse])
async def get_course_attendance(
    course_id: str,
    date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Get attendance records for a course, optionally filtered by date
    """
    # Verify course belongs to teacher
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.teacher_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not assigned to you"
        )
    
    query = db.query(Attendance).filter(Attendance.course_id == course_id)
    
    if date:
        query = query.filter(Attendance.date == date)
        
    records = query.all()
    
    # Manually populate student names since we need to join or fetch
    # Alternatively, we could do a join query, but for simplicity let's stick to this or assume relationships work
    # Since Attendance model has `student` relationship, Pydantic `from_orm` might not automatically pick `student_name`
    # unless we add a property or use a join.
    # Let's rely on Pydantic config or manual population if needed.
    # The AttendanceResponse schema has `student_name`.
    # Let's make sure it populates.
    
    result = []
    for record in records:
        resp = AttendanceResponse.from_orm(record)
        if record.student:
            resp.student_name = record.student.full_name
        result.append(resp)
        
    return result
