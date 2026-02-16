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
    # Join Payment with Enrollment to filter by student_id
    payments = db.query(Payment).join(Enrollment).filter(
        Enrollment.student_id == current_user.id
    ).order_by(Payment.payment_date.desc()).all()
    
    return [PaymentResponse.from_orm(payment) for payment in payments]
