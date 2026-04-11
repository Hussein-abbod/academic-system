from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.ai_advisor import AiSubscription
from schemas.ai_advisor import TeacherOrAdminSubscriptionRequest, AiStatusResponse
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
    sub.is_active = True
    
    db.commit()
    db.refresh(sub)
    
    return AiStatusResponse(
        is_active=sub.is_active,
        level=sub.level,
        daily_minutes_limit=sub.daily_minutes_limit,
        minutes_used_today=sub.minutes_used_today,
        time_remaining_seconds=max(0.0, (sub.daily_minutes_limit - sub.minutes_used_today) * 60),
        has_access=True
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
