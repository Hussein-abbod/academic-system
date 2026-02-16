from sqlalchemy import Column, String, ForeignKey, DateTime, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from database import Base


class EnrollmentStatus(str, enum.Enum):
    """Enrollment status enumeration"""
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DROPPED = "DROPPED"


class Enrollment(Base):
    """Enrollment model linking students to courses"""
    __tablename__ = "enrollments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE, nullable=False)
    current_progress = Column(Numeric(5, 2), default=0.00, nullable=False)  # Progress percentage (0-100)
    
    # Relationships
    student = relationship("User", back_populates="enrollments", foreign_keys=[student_id])
    course = relationship("Course", back_populates="enrollments")
    payments = relationship("Payment", back_populates="enrollment")
    
    def __repr__(self):
        return f"<Enrollment(id={self.id}, student={self.student.full_name if self.student else None}, course={self.course.name if self.course else None})>"
