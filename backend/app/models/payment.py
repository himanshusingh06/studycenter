from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    receipt_number = Column(String(100), unique=True, index=True, nullable=False)  # e.g. REC-2026-000123
    
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    total_amount = Column(Float, nullable=False)
    discount_applied = Column(Float, default=0.0, nullable=False)
    payment_type = Column(String(50), nullable=False)  # ONE_TIME, MONTHLY, ADVANCE, CUSTOM
    payment_mode = Column(String(50), nullable=False)  # CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, OTHER
    
    collected_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="PAID", nullable=False)  # PAID, CANCELLED, REFUNDED

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="payments")
    collected_by = relationship("User")
    items = relationship("PaymentItem", back_populates="payment", cascade="all, delete-orphan")
    receipt = relationship("Receipt", back_populates="payment", uselist=False, cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="payment", cascade="all, delete-orphan")


class PaymentItem(Base):
    __tablename__ = "payment_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False)
    fee_month_id = Column(Integer, ForeignKey("fee_months.id", ondelete="SET NULL"), nullable=True)
    
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)

    payment = relationship("Payment", back_populates="items")
    fee_month = relationship("FeeMonth", back_populates="payment_items")


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, unique=True)
    receipt_number = Column(String(100), unique=True, index=True, nullable=False)
    
    pdf_url = Column(String(500), nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    payment = relationship("Payment", back_populates="receipt")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False)
    
    refund_amount = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    refund_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    refunded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    payment = relationship("Payment", back_populates="refunds")
    refunded_by = relationship("User")
