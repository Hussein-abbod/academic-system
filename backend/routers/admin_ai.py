from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.ai_advisor import AiSubscription
from schemas.ai_advisor import TeacherOrAdminSubscriptionRequest, AiStatusResponse, AiSubscriptionAdminResponse
from auth.dependencies import require_admin


router = APIRouter(prefix="/admin/ai-advisor", tags=["Admin - AI Advisor"])


@router.post("/subscribe/{student_id}", response_model=AiStatusResponse)
async def subscribe_student_to_ai(
    student_id: str,
    request: TeacherOrAdminSubscriptionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    sub = db.query(AiSubscription).filter(AiSubscription.student_id == student_id).first()
    if not sub:
        sub = AiSubscription(student_id=student_id)
        db.add(sub)
        
    sub.level = request.level
    sub.daily_minutes_limit = request.daily_minutes_limit
    sub.monthly_fee = request.monthly_fee
    sub.is_active = True
    
    db.commit()
    db.refresh(sub)
    
    return AiStatusResponse(
        is_active=sub.is_active,
        level=sub.level,
        daily_minutes_limit=sub.daily_minutes_limit,
        minutes_used_today=sub.minutes_used_today,
        time_remaining_seconds=max(0.0, (sub.daily_minutes_limit - sub.minutes_used_today) * 60),
        has_access=True,
        monthly_fee=float(sub.monthly_fee),
        enrolled_at=sub.enrolled_at
    )

@router.delete("/unsubscribe/{student_id}")
async def unsubscribe_student_from_ai(
    student_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    sub = db.query(AiSubscription).filter(AiSubscription.student_id == student_id).first()
    if sub:
        sub.is_active = False
        db.commit()
    return {"message": "Student AI access successfully revoked."}

@router.get("/subscriptions", response_model=list[AiSubscriptionAdminResponse])
async def list_ai_subscriptions(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all AI Subscriptions for admin management."""
    subscriptions = db.query(AiSubscription).all()
    results = []
    
    for sub in subscriptions:
        user = db.query(User).filter(User.id == sub.student_id).first()
        student_name = user.full_name if user else "Unknown Student"
        
        results.append(
            AiSubscriptionAdminResponse(
                student_id=sub.student_id,
                student_name=student_name,
                level=sub.level,
                daily_minutes_limit=sub.daily_minutes_limit,
                monthly_fee=float(sub.monthly_fee),
                enrolled_at=sub.enrolled_at,
                is_active=sub.is_active,
                minutes_used_today=sub.minutes_used_today
            )
        )
        
    return results
