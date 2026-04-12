from fastapi import APIRouter, Depends
from sqlalchemy import func
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
        
    # Get recent quizzes
    from models.quiz import Quiz
    from schemas.models import QuizResponse
    
    course_ids = [e.course_id for e in active_enrollments]
    recent_quizzes = []
    
    if course_ids:
        quizzes = db.query(Quiz).filter(
            Quiz.course_id.in_(course_ids)
        ).order_by(Quiz.created_at.desc()).limit(5).all()
        
        recent_quizzes = [QuizResponse.from_orm(q) for q in quizzes]
        
    # Calculate Financials (Consolidated)
    from models.payment import Payment, PaymentStatus
    from models.ai_advisor import AiSubscription
    from datetime import datetime
    
    # 1. Course Financials
    total_course_expected = 0
    total_course_paid = 0
    now = datetime.utcnow()
    
    for e in enrollments:
        # Expected
        enrollment_date = e.enrollment_date
        months_enrolled = (now.year - enrollment_date.year) * 12 + (now.month - enrollment_date.month)
        if now.day < enrollment_date.day:
            months_enrolled -= 1
        months_enrolled += 1
        if months_enrolled < 1: months_enrolled = 1
        total_course_expected += float(months_enrolled * (e.course.price if e.course else 0))
        
        # Paid
        paid_for_enrollment = db.query(func.sum(Payment.amount)).filter(
            Payment.enrollment_id == e.id,
            Payment.payment_status == PaymentStatus.PAID
        ).scalar() or 0
        total_course_paid += float(paid_for_enrollment)
        
    # 2. AI Advisor Financials
    total_ai_expected = 0
    total_ai_paid = 0
    ai_sub = db.query(AiSubscription).filter(AiSubscription.student_id == current_user.id).first()
    
    if ai_sub and ai_sub.is_active:
        enrolled_at = ai_sub.enrolled_at
        months_enrolled = (now.year - enrolled_at.year) * 12 + (now.month - enrolled_at.month)
        if now.day < enrolled_at.day:
            months_enrolled -= 1
        months_enrolled += 1
        if months_enrolled < 1: months_enrolled = 1
        total_ai_expected = float(months_enrolled * float(ai_sub.monthly_fee))
        
        # Paid
        paid_for_ai = db.query(func.sum(Payment.amount)).filter(
            Payment.ai_subscription_id == ai_sub.student_id,
            Payment.payment_status == PaymentStatus.PAID
        ).scalar() or 0
        total_ai_paid = float(paid_for_ai)

    return {
        "total_courses": total_courses,
        "active_courses": active_courses,
        "completed_courses": completed_courses,
        "average_progress": round(avg_progress, 1),
        "recent_quizzes": recent_quizzes,
        "financials": {
            "total_expected": round(total_course_expected + total_ai_expected, 2),
            "total_paid": round(total_course_paid + total_ai_paid, 2),
            "balance": round((total_course_expected + total_ai_expected) - (total_course_paid + total_ai_paid), 2)
        }
    }
