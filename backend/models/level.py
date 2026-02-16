from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import relationship
import uuid
from database import Base


class Level(Base):
    """Level model for course difficulty (Beginner, Intermediate, Advanced)"""
    __tablename__ = "levels"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)  # For sorting (1 = Beginner, 2 = Intermediate, etc.)
    passing_score_requirement = Column(Integer, default=80, nullable=False)  # Minimum score to advance
    
    # Relationships
    courses = relationship("Course", back_populates="level")
    
    def __repr__(self):
        return f"<Level(id={self.id}, name={self.name}, order={self.order})>"
