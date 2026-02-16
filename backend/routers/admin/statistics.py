from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
from models.user import User, UserRole
from models.course import Course
from models.enrollment import Enrollment
from models.payment import Payment, PaymentStatus
from auth.dependencies import require_admin

router = APIRouter(prefix="/admin/statistics", tags=["Admin - Statistics"])


@router.get("/dashboard", dependencies=[Depends(require_admin)])
async def get_dashboard_statistics(db: Session = Depends(get_db)):
    """Get dashboard overview statistics"""
    
    # Count total students
    total_students = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True
    ).count()
    
    # Count total teachers
    total_teachers = db.query(User).filter(
        User.role == UserRole.TEACHER,
        User.is_active == True
    ).count()
    
    # Count active courses
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    
    # Calculate total revenue (only PAID payments)
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    
    # Get pending payments count
    pending_payments = db.query(Payment).filter(
        Payment.payment_status == PaymentStatus.PENDING
    ).count()
    
    # Get recent enrollments (last 5)
    recent_enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.student),
        joinedload(Enrollment.course)
    ).order_by(
        Enrollment.enrollment_date.desc()
    ).limit(5).all()
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "active_courses": active_courses,
        "total_revenue": float(total_revenue),
        "pending_payments": pending_payments,
        "recent_enrollments": [
            {
                "id": str(enrollment.id),
                "student_name": enrollment.student.full_name,
                "course_name": enrollment.course.name,
                "enrollment_date": enrollment.enrollment_date.isoformat(),
                "status": enrollment.status.value
            }
            for enrollment in recent_enrollments
        ]
    }


@router.get("/revenue", dependencies=[Depends(require_admin)])
async def get_revenue_statistics(db: Session = Depends(get_db)):
    """Get revenue breakdown by status"""
    
    # Revenue by payment status
    revenue_by_status = db.query(
        Payment.payment_status,
        func.sum(Payment.amount).label("total")
    ).group_by(Payment.payment_status).all()
    
    return {
        "by_status": [
            {"status": status.value, "amount": float(total)}
            for status, total in revenue_by_status
        ]
    }


@router.get("/students", dependencies=[Depends(require_admin)])
async def get_student_statistics(db: Session = Depends(get_db)):
    """Get student progress overview"""
    
    # Get average progress across all enrollments
    avg_progress = db.query(func.avg(Enrollment.current_progress)).scalar() or 0
    
    # Count enrollments by status
    enrollments_by_status = db.query(
        Enrollment.status,
        func.count(Enrollment.id).label("count")
    ).group_by(Enrollment.status).all()
    
    return {
        "average_progress": float(avg_progress),
        "enrollments_by_status": [
            {"status": status.value, "count": count}
            for status, count in enrollments_by_status
        ]
    }
