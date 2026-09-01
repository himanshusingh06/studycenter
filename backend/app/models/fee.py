from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)  # Plan A, Plan B, etc.
    description = Column(Text, nullable=True)
    one_time_fee = Column(Float, default=0.0, nullable=False)
    monthly_fee = Column(Float, default=0.0, nullable=False)
    custom_charges = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    late_fee = Column(Float, default=0.0, nullable=False)
    validity_months = Column(Integer, default=12, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    students = relationship("Student", back_populates="fee_structure")


class FeeMonth(Base):
    __tablename__ = "fee_months"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1 to 12
    
    due_amount = Column(Float, default=0.0, nullable=False)
    paid_amount = Column(Float, default=0.0, nullable=False)
    pending_amount = Column(Float, default=0.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, PARTIALLY_PAID, PAID, OVERDUE, WAIVED, CANCELLED
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="fee_months")
    payment_items = relationship("PaymentItem", back_populates="fee_month")
