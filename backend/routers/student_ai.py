import json
import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from models.user import User, UserRole
from models.ai_advisor import AiSubscription, AiConversationState, ProficiencyLevel
from schemas.ai_advisor import (
    AiStatusResponse, ChatMessageRequest, ChatMessageResponse, 
    UpdateSettingsRequest, TranslationRequest, TranslationResponse
)
from auth.dependencies import get_current_user

# Lazy-loaded Groq client
_groq_client = None

def get_groq_client():
    global _groq_client
    if _groq_client:
        return _groq_client
    
    if not settings.GROQ_API_KEY:
        return None
        
    try:
        from groq import Groq
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
        return _groq_client
    except ImportError:
        return None

router = APIRouter(prefix="/student/ai-advisor", tags=["Student - AI Advisor"])

def get_system_prompt(level: ProficiencyLevel):
    base_prompt = (
        "You are an engaging, adventurous, and incredibly friendly AI English speaking tutor. "
        "Your goal is to make the student EXCITED to speak. Avoid short, boring answers. "
        "Strict Response Structure: "
        "1. ALWAYS start your response with exactly ONE sentence that gently corrects the student's grammar or pronunciation in their last message. If their grammar was perfect, use this first sentence to specifically praise one thing they did well. "
        "2. Then, provide your engaging conversational reply. "
        "Instead of just answering, tell brief, interesting stories, share fun facts, and use expressive language. "
        "Always follow up with an open-ended question that sparks imagination (don't use emojis). "
        "3. CRITICAL: Your entire response must NOT exceed a total of 5 sentences. Keep it concise yet engaging."
        "Prioritize keeping the conversation 'alive' and fun."
    )
    if level == ProficiencyLevel.BASIC:
        return f"{base_prompt} You must: Use simple A1/A2 English. Use simple words but be very descriptive and enthusiastic. Don't just say 'Yes', say 'Yes! That sounds like a wonderful idea! Shall we go?'"
    elif level == ProficiencyLevel.INTERMEDIATE:
        return f"{base_prompt} You must: Use B1/B2 English. Share interesting insights or cultural facts related to the topic. Actively drive the conversation forward with creative scenarios."
    else:
        return f"{base_prompt} You must: Use C1/C2 advanced English. Engage in deep, thoughtful discussion. Use idioms and sophisticated humor to keep it lively."

def _check_and_reset_daily_limit(sub: AiSubscription, db: Session):
    today = datetime.utcnow().date()
    if sub.last_used_date != today:
        sub.minutes_used_today = 0.0
        sub.last_used_date = today
        db.commit()

@router.get("/status", response_model=AiStatusResponse)
async def get_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this feature")

    sub = db.query(AiSubscription).filter(AiSubscription.student_id == current_user.id).first()
    if not sub or not sub.is_active:
        return AiStatusResponse(
            is_active=False,
            level=ProficiencyLevel.BASIC,
            daily_minutes_limit=0,
            minutes_used_today=0.0,
            time_remaining_seconds=0.0,
            has_access=False
        )

    _check_and_reset_daily_limit(sub, db)
    
    remaining_secs = max(0.0, (sub.daily_minutes_limit - sub.minutes_used_today) * 60)
    
    # Load history
    state = db.query(AiConversationState).filter(AiConversationState.student_id == current_user.id).first()
    history = []
    if state:
        try:
            full_history = json.loads(state.history_json)
            # Filter out system messages for the UI
            history = [m for m in full_history if m.get("role") != "system"]
        except:
            history = []

    return AiStatusResponse(
        is_active=sub.is_active,
        level=sub.level,
        daily_minutes_limit=sub.daily_minutes_limit,
        minutes_used_today=sub.minutes_used_today,
        time_remaining_seconds=remaining_secs,
        has_access=(remaining_secs > 0),
        history=history,
        native_language=sub.native_language
    )


@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_ai(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client = get_groq_client()
    if not client:
        raise HTTPException(status_code=503, detail="AI Service is currently unconfigured by administrator (missing GROQ_API_KEY).")

    sub = db.query(AiSubscription).filter(AiSubscription.student_id == current_user.id).first()
    if not sub or not sub.is_active:
        raise HTTPException(status_code=403, detail="You do not have an active AI subscription.")
        
    _check_and_reset_daily_limit(sub, db)
    
    if sub.minutes_used_today >= sub.daily_minutes_limit:
        raise HTTPException(status_code=403, detail="Daily time limit exceeded. Please return tomorrow!")

    # Load Conversation State
    state = db.query(AiConversationState).filter(AiConversationState.student_id == current_user.id).first()
    if not state:
        state = AiConversationState(student_id=current_user.id, history_json="[]")
        db.add(state)
        db.commit()

    try:
        messages = json.loads(state.history_json)
    except:
        messages = []

    # Insert system prompt if empty
    if not messages:
        messages.append({
            "role": "system",
            "content": get_system_prompt(sub.level)
        })

    # Add user message
    messages.append({
        "role": "user",
        "content": request.text
    })
    
    # Optional constraint: limit history to last 20 messages to save context limit and money
    if len(messages) > 20:
        messages = [messages[0]] + messages[-19:]

    start_time = time.time()

    # Call Groq LLM
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Updated to supported version
            messages=messages,
            temperature=0.7,
            max_tokens=150,
            stream=False
        )
        ai_response = completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    end_time = time.time()
    
    # Calculate time taken for this turn (roughly reading time + generation time + network overhead)
    # Let's assess fixed 10 seconds of "engaged conversation time" for processing + listening block padding
    time_engaged_minutes = 10 / 60.0  
    
    sub.minutes_used_today += time_engaged_minutes
    db.commit()

    # Append AI message and save
    messages.append({
        "role": "assistant",
        "content": ai_response
    })
    state.history_json = json.dumps(messages)
    db.commit()

    remaining_secs = max(0.0, (sub.daily_minutes_limit - sub.minutes_used_today) * 60)

    return ChatMessageResponse(
        reply=ai_response,
        minutes_used_this_turn=time_engaged_minutes,
        time_remaining_seconds=remaining_secs
    )


@router.patch("/tick-time", response_model=AiStatusResponse)
async def tick_time(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called every minute by the frontend to safely deduct background tracking time."""
    sub = db.query(AiSubscription).filter(AiSubscription.student_id == current_user.id).first()
    if not sub or not sub.is_active:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    _check_and_reset_daily_limit(sub, db)
    
    # Increment by 1 minute
    if sub.minutes_used_today < sub.daily_minutes_limit:
        sub.minutes_used_today += 1.0
        db.commit()
        
    remaining_secs = max(0.0, (sub.daily_minutes_limit - sub.minutes_used_today) * 60)
    
    # Load history to prevent clearing it on frontend during background sync
    state = db.query(AiConversationState).filter(AiConversationState.student_id == current_user.id).first()
    history = []
    if state:
        try:
            full_history = json.loads(state.history_json)
            history = [m for m in full_history if m.get("role") != "system"]
        except:
            history = []
    
    return AiStatusResponse(
        is_active=sub.is_active,
        level=sub.level,
        daily_minutes_limit=sub.daily_minutes_limit,
        minutes_used_today=sub.minutes_used_today,
        time_remaining_seconds=remaining_secs,
        has_access=(remaining_secs > 0),
        history=history,
        native_language=sub.native_language
    )

@router.patch("/settings", response_model=AiStatusResponse)
async def update_settings(
    request: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates student's AI Advisor settings (like native language)."""
    sub = db.query(AiSubscription).filter(AiSubscription.student_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.native_language = request.native_language
    db.commit()
    
    # Delegate to get_status to return full consistent object
    return await get_status(current_user, db)

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Translates text to user's native language using AI."""
    client = get_groq_client()
    if not client:
        raise HTTPException(status_code=503, detail="AI Service unconfigured")

    sub = db.query(AiSubscription).filter(AiSubscription.student_id == current_user.id).first()
    target_lang = sub.native_language if sub and sub.native_language else "Arabic"

    prompt = (
        f"You are a professional translator. Translate the following text into {target_lang}.\n\n"
        "Rules:\n"
        "1. Provide ONLY the direct translation of the text and absolutely nothing else.\n"
        "2. Do not provide any explanations, definitions, context, or conversational filler.\n"
        "3. Keep the response extremely concise and clear.\n"
        "4. Do not write any words in English.\n\n"
        f"Text to process: {request.text}"
    )

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )
        translation = completion.choices[0].message.content.strip()
        return TranslationResponse(translation=translation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history")
async def reset_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes conversation history to start fresh."""
    state = db.query(AiConversationState).filter(AiConversationState.student_id == current_user.id).first()
    if state:
        state.history_json = "[]"
        db.commit()
    return {"message": "History cleared"}
