from sqlalchemy import Column, String, Date, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from datetime import date
import uuid
import enum
from database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    EXCUSED = "EXCUSED"

class Attendance(Base):
    """Attendance model for tracking student presence"""
    __tablename__ = "attendance"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    status = Column(SQLEnum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    course = relationship("Course", back_populates="attendance_records")
    student = relationship("User", back_populates="attendance_records")

    def __repr__(self):
        return f"<Attendance(id={self.id}, student_id={self.student_id}, date={self.date}, status={self.status})>"
