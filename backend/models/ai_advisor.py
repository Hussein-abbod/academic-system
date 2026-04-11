from sqlalchemy import Column, String, Integer, Float, Date, Boolean, ForeignKey, Enum as SQLEnum, Text, DateTime
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base


class ProficiencyLevel(str, enum.Enum):
    BASIC = "BASIC"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class AiSubscription(Base):
    """Tracks a student's active enrollment and state in the AI Advisor feature"""
    __tablename__ = "ai_subscriptions"

    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    level = Column(SQLEnum(ProficiencyLevel), nullable=False, default=ProficiencyLevel.BASIC)
    daily_minutes_limit = Column(Integer, nullable=False, default=60)
    minutes_used_today = Column(Float, nullable=False, default=0.0)
    last_used_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationship to user
    student = relationship("User")


class AiConversationState(Base):
    """Stores the active conversation memory for a student so they can pause and return"""
    __tablename__ = "ai_conversation_states"

    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    # Storing messages as serialized JSON string to avoid database dependency constraints for JSON columns
    history_json = Column(Text, nullable=False, default='[]')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("User")
