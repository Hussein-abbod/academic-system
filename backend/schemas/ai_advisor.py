from pydantic import BaseModel
from typing import Optional
from datetime import date
from models.ai_advisor import ProficiencyLevel


class AiStatusResponse(BaseModel):
    is_active: bool
    level: ProficiencyLevel
    daily_minutes_limit: int
    minutes_used_today: float
    time_remaining_seconds: float
    has_access: bool
    history: Optional[list] = []
    native_language: Optional[str] = "Arabic"


class ChatMessageRequest(BaseModel):
    text: str


class ChatMessageResponse(BaseModel):
    reply: str
    minutes_used_this_turn: float
    time_remaining_seconds: float


class TeacherOrAdminSubscriptionRequest(BaseModel):
    level: ProficiencyLevel
    daily_minutes_limit: int

class UpdateSettingsRequest(BaseModel):
    native_language: str

class TranslationRequest(BaseModel):
    text: str

class TranslationResponse(BaseModel):
    translation: str
