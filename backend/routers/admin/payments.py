from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.payment import Payment
from models.enrollment import Enrollment
from models.course import Course
from schemas.models import PaymentCreate, PaymentUpdate, PaymentResponse
from auth.dependencies import require_admin
from datetime import datetime
from sqlalchemy import func

router = APIRouter(prefix="/admin/payments", tags=["Admin - Payments"])


@router.post("", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db)):
    """Record a new payment for a Course or AI Advisor"""
    
    # 1. Handle AI Advisor Payment
    if payment_data.ai_subscription_id:
        from models.ai_advisor import AiSubscription
        sub = db.query(AiSubscription).filter(AiSubscription.student_id == payment_data.ai_subscription_id).first()
        if not sub:
            raise HTTPException(status_code=404, detail="AI Subscription not found")
            
        # Anniversary calculation for AI
        now = datetime.utcnow()
        enrolled_at = sub.enrolled_at
        months_enrolled = (now.year - enrolled_at.year) * 12 + (now.month - enrolled_at.month)
        if now.day < enrolled_at.day:
            months_enrolled -= 1
        months_enrolled += 1 
        if months_enrolled < 1: months_enrolled = 1
        
        total_expected = months_enrolled * float(sub.monthly_fee)
        
        total_paid_result = db.query(func.sum(Payment.amount)).filter(
            Payment.ai_subscription_id == sub.student_id,
            Payment.payment_status == 'PAID'
        ).scalar()
        total_paid = float(total_paid_result) if total_paid_result else 0.0
        
        current_balance = total_expected - total_paid
        
        if payment_data.amount > (current_balance + 0.01):
            raise HTTPException(
                status_code=400, 
                detail=f"Payment amount (${payment_data.amount:.2f}) exceeds AI balance due (${current_balance:.2f})."
            )

    # 2. Handle Regular Course Payment
    elif payment_data.enrollment_id:
        enrollment = db.query(Enrollment).filter(Enrollment.id == payment_data.enrollment_id).first()
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")

        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course associated with enrollment not found")

        # Anniversary calculation (Keep existing logic)
        enrollment_date = enrollment.enrollment_date
        now = datetime.utcnow()
        months_enrolled = (now.year - enrollment_date.year) * 12 + (now.month - enrollment_date.month)
        if now.day < enrollment_date.day:
            months_enrolled -= 1
        months_enrolled += 1
        if months_enrolled < 1: months_enrolled = 1
            
        total_expected = months_enrolled * float(course.price)

        total_paid_result = db.query(func.sum(Payment.amount)).filter(
            Payment.enrollment_id == enrollment.id,
            Payment.payment_status == 'PAID'
        ).scalar()
        total_paid = float(total_paid_result) if total_paid_result else 0.0

        current_balance = total_expected - total_paid

        if payment_data.amount > (current_balance + 0.01):
            raise HTTPException(
                status_code=400, 
                detail=f"Payment amount (${payment_data.amount:.2f}) exceeds current course balance due (${current_balance:.2f})."
            )
    else:
        raise HTTPException(status_code=400, detail="Either enrollment_id or ai_subscription_id is required")

    new_payment = Payment(**payment_data.dict())
    if payment_data.payment_status == "PAID":
        new_payment.payment_date = datetime.utcnow()
    
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    return PaymentResponse.from_orm(new_payment)


@router.get("", response_model=List[PaymentResponse], dependencies=[Depends(require_admin)])
async def list_payments(
    enrollment_id: str = None,
    payment_status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all payments with optional filtering"""
    query = db.query(Payment)
    
    if enrollment_id:
        query = query.filter(Payment.enrollment_id == enrollment_id)
    if payment_status:
        query = query.filter(Payment.payment_status == payment_status)
    
    payments = query.offset(skip).limit(limit).all()
    return [PaymentResponse.from_orm(payment) for payment in payments]


@router.get("/{payment_id}", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def get_payment(payment_id: str, db: Session = Depends(get_db)):
    """Get payment details by ID"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return PaymentResponse.from_orm(payment)


@router.put("/{payment_id}", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def update_payment(payment_id: str, payment_data: PaymentUpdate, db: Session = Depends(get_db)):
    """Update payment status or amount"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Update fields
    update_data = payment_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    # Set payment_date if status changed to PAID
    if payment_data.payment_status == "PAID" and not payment.payment_date:
        payment.payment_date = datetime.utcnow()
    
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse.from_orm(payment)
