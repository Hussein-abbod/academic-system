from sqlalchemy import Column, String, ForeignKey, DateTime, Enum as SQLEnum, Numeric, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from database import Base


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PAID = "PAID"
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"


class Payment(Base):
    """Payment model for tracking student course payments"""
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    enrollment_id = Column(String(36), ForeignKey("enrollments.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    enrollment = relationship("Enrollment", back_populates="payments")
    
    def __repr__(self):
        return f"<Payment(id={self.id}, amount={self.amount}, status={self.payment_status})>"
