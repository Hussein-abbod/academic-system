from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.payment import Payment
from schemas.models import PaymentCreate, PaymentUpdate, PaymentResponse
from auth.dependencies import require_admin
from datetime import datetime

router = APIRouter(prefix="/admin/payments", tags=["Admin - Payments"])


@router.post("", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db)):
    """Record a new payment"""
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
