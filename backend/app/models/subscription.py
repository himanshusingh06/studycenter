from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id", ondelete="RESTRICT"), nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, EXPIRING_SOON, EXPIRED, SUSPENDED, CANCELLED
    billing_frequency = Column(String(50), default="MONTHLY", nullable=False)
    
    fee_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    renewal_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="subscriptions")
    fee_structure = relationship("FeeStructure", back_populates="subscriptions")
    history = relationship("SubscriptionHistory", back_populates="subscription", cascade="all, delete-orphan")


class SubscriptionHistory(Base):
    __tablename__ = "subscription_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    
    action = Column(String(100), nullable=False)  # CREATED, RENEWED, CANCELLED, EXPIRED, SUSPENDED
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    subscription = relationship("Subscription", back_populates="history")
