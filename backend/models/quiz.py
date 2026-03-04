from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Float,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class QuizType(str, enum.Enum):
    READING = "READING"
    LISTENING = "LISTENING"
    MIXED = "MIXED"


class QuizStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    LISTENING = "LISTENING"
    SHORT_ANSWER = "SHORT_ANSWER"


class SubmissionStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"


# ---------------------------------------------------------------------------
# Quiz (header)
# ---------------------------------------------------------------------------

class Quiz(Base):
    """Quiz created by a teacher for a course"""
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    quiz_type = Column(SQLEnum(QuizType), nullable=False, default=QuizType.READING)
    status = Column(SQLEnum(QuizStatus), nullable=False, default=QuizStatus.DRAFT)

    time_limit_minutes = Column(Integer, nullable=True)   # None = no limit
    max_attempts = Column(Integer, nullable=False, default=1)

    open_date = Column(DateTime, nullable=True)
    close_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="quizzes")
    creator = relationship("User", foreign_keys=[created_by])
    questions = relationship(
        "QuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.order_index"
    )
    submissions = relationship("QuizSubmission", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz(id={self.id}, title={self.title}, status={self.status})>"


# ---------------------------------------------------------------------------
# QuizQuestion
# ---------------------------------------------------------------------------

class QuizQuestion(Base):
    """A single question inside a quiz"""
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)

    order_index = Column(Integer, nullable=False, default=0)
    question_type = Column(SQLEnum(QuestionType), nullable=False, default=QuestionType.MCQ)
    question_text = Column(Text, nullable=False)
    audio_file_path = Column(String(500), nullable=True)   # For LISTENING questions
    points = Column(Float, nullable=False, default=1.0)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    options = relationship(
        "QuizOption",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuizOption.order_index"
    )
    answers = relationship("QuizAnswer", back_populates="question")

    def __repr__(self):
        return f"<QuizQuestion(id={self.id}, type={self.question_type})>"


# ---------------------------------------------------------------------------
# QuizOption
# ---------------------------------------------------------------------------

class QuizOption(Base):
    """An answer option for a MCQ / LISTENING question"""
    __tablename__ = "quiz_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)

    order_index = Column(Integer, nullable=False, default=0)
    option_text = Column(String(500), nullable=True)
    option_image_path = Column(String(500), nullable=True)
    is_correct = Column(Boolean, nullable=False, default=False)

    # Relationships
    question = relationship("QuizQuestion", back_populates="options")

    def __repr__(self):
        return f"<QuizOption(id={self.id}, correct={self.is_correct})>"


# ---------------------------------------------------------------------------
# QuizSubmission (one per student attempt)
# ---------------------------------------------------------------------------

class QuizSubmission(Base):
    """Records a single student attempt at a quiz"""
    __tablename__ = "quiz_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    attempt_number = Column(Integer, nullable=False, default=1)
    status = Column(SQLEnum(SubmissionStatus), nullable=False, default=SubmissionStatus.IN_PROGRESS)

    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    score = Column(Float, nullable=True)          # null until submitted
    max_score = Column(Float, nullable=True)

    # Relationships
    quiz = relationship("Quiz", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    answers = relationship("QuizAnswer", back_populates="submission", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<QuizSubmission(id={self.id}, student={self.student_id}, score={self.score})>"


# ---------------------------------------------------------------------------
# QuizAnswer (one per question per submission)
# ---------------------------------------------------------------------------

class QuizAnswer(Base):
    """Student's answer to a single question"""
    __tablename__ = "quiz_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("quiz_submissions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)

    selected_option_id = Column(String(36), ForeignKey("quiz_options.id"), nullable=True)
    short_answer_text = Column(Text, nullable=True)

    is_correct = Column(Boolean, nullable=True)
    points_awarded = Column(Float, nullable=True, default=0.0)

    # Relationships
    submission = relationship("QuizSubmission", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="answers")
    selected_option = relationship("QuizOption", foreign_keys=[selected_option_id])

    def __repr__(self):
        return f"<QuizAnswer(id={self.id}, correct={self.is_correct})>"
