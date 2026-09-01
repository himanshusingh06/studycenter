from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AttendanceDay(Base):
    __tablename__ = "attendance_days"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    
    total_seconds = Column(Integer, default=0, nullable=False)
    session_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="attendance_days")
    sessions = relationship("AttendanceSession", back_populates="attendance_day", cascade="all, delete-orphan")


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_day_id = Column(Integer, ForeignKey("attendance_days.id", ondelete="CASCADE"), nullable=False, index=True)
    
    check_in_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    
    checked_in_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    checked_out_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    source = Column(String(50), default="DESK", nullable=False)  # MANUAL, QR_CODE, DESK
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, COMPLETED, CANCELLED, CORRECTED
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="attendance_sessions")
    attendance_day = relationship("AttendanceDay", back_populates="sessions")
    checked_in_by = relationship("User", foreign_keys=[checked_in_by_user_id])
    checked_out_by = relationship("User", foreign_keys=[checked_out_by_user_id])
