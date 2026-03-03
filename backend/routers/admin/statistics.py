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


@router.get("/revenue-chart", dependencies=[Depends(require_admin)])
async def get_revenue_chart_data(period: str = "6m", db: Session = Depends(get_db)):
    """Get revenue chart data aggregated by time"""
    from datetime import datetime, timedelta
    from sqlalchemy import case
    
    # Calculate start date based on period
    now = datetime.utcnow()
    if period == "1y":
        start_date = now - timedelta(days=365)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "all":
        start_date = None  # No date filter for all time
    else:  # Default to 6m
        start_date = now - timedelta(days=180)

    # Use COALESCE so payments where payment_date is NULL fall back to created_at
    effective_date = func.coalesce(Payment.payment_date, Payment.created_at)

    # For 30-day view use daily granularity; all others use monthly
    if period == "30d":
        date_label = func.strftime('%Y-%m-%d', effective_date).label("date_label")
    else:
        date_label = func.strftime('%Y-%m', effective_date).label("date_label")

    query = db.query(
        date_label,
        func.sum(Payment.amount).label("total")
    ).filter(
        Payment.payment_status == PaymentStatus.PAID
    )

    if start_date is not None:
        query = query.filter(effective_date >= start_date)

    revenue_data = query.group_by(date_label).order_by(date_label).all()

    # Format for frontend
    return [
        {"date": date_str, "amount": float(total or 0)}
        for date_str, total in revenue_data
    ]
