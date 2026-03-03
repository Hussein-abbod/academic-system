from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from database import Base

class QuizType(str, enum.Enum):
    READING = "READING"
    LISTENING = "LISTENING"

class Quiz(Base):
    """Quiz model for courses"""
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    quiz_type = Column(SQLEnum(QuizType), nullable=False)
    link = Column(String(500), nullable=True)  # Link to Microsoft Form or external quiz
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="quizzes")

    def __repr__(self):
        return f"<Quiz(id={self.id}, title={self.title}, type={self.quiz_type})>"
