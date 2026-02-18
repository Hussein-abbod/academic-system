from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.payment import Payment
from models.enrollment import Enrollment
from models.user import User
from schemas.models import PaymentResponse
from auth.dependencies import require_student

router = APIRouter(tags=["Student - Payments"])

@router.get("/payments", response_model=List[PaymentResponse])
async def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Get all payments made by the current student
    """
    # Join Payment with Enrollment and Course to filter by student_id and get course name
    from models.course import Course
    from sqlalchemy.orm import joinedload
    
    payments = db.query(Payment).options(
        joinedload(Payment.enrollment).joinedload(Enrollment.course)
    ).join(Enrollment).join(Course).filter(
        Enrollment.student_id == current_user.id
    ).order_by(Payment.payment_date.desc()).all()
    
    # Manually populate course_name since it's not a direct field on Payment model
    results = []
    for payment in payments:
        response = PaymentResponse.from_orm(payment)
        if payment.enrollment and payment.enrollment.course:
            response.course_name = payment.enrollment.course.name
        results.append(response)
            
    return results
