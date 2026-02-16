from sqlalchemy import Column, String, Text, Integer, Date, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base


class Course(Base):
    """Course model"""
    __tablename__ = "courses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    level_id = Column(String(36), ForeignKey("levels.id"), nullable=False)
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    capacity = Column(Integer, default=20, nullable=False)  # Maximum students
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    level = relationship("Level", back_populates="courses")
    teacher = relationship("User", back_populates="courses_taught", foreign_keys=[teacher_id])
    enrollments = relationship("Enrollment", back_populates="course")
    
    def __repr__(self):
        return f"<Course(id={self.id}, name={self.name}, level={self.level.name if self.level else None})>"
