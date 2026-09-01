from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g. STU-2026-00001
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    dob = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    mobile = Column(String(20), index=True, nullable=False)
    alt_mobile = Column(String(20), nullable=True)
    email = Column(String(255), index=True, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    # Guardian Information
    guardian_name = Column(String(150), nullable=True)
    guardian_relation = Column(String(50), nullable=True)
    guardian_mobile = Column(String(20), index=True, nullable=True)
    guardian_email = Column(String(255), nullable=True)
    guardian_address = Column(Text, nullable=True)

    # Academic Details
    course = Column(String(100), nullable=True)
    college = Column(String(200), nullable=True)
    qualification = Column(String(100), nullable=True)
    academic_year = Column(String(50), nullable=True)

    # Emergency Contact
    emergency_contact_name = Column(String(150), nullable=True)
    emergency_contact_number = Column(String(20), nullable=True)
    emergency_relation = Column(String(50), nullable=True)

    # Study Center Details
    enrollment_date = Column(Date, default=date.today, nullable=False)
    joining_date = Column(Date, default=date.today, nullable=False)
    seat_number = Column(String(50), nullable=True)
    preferred_timing = Column(String(100), nullable=True)  # e.g. Full Day, Morning, Evening, Night
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE, SUSPENDED

    # Direct Fee Plan Mapping & Custom Pricing
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id", ondelete="SET NULL"), nullable=True)
    custom_monthly_fee = Column(Float, nullable=True)  # Override plan default monthly fee
    custom_one_time_fee = Column(Float, nullable=True)  # Override plan default one-time admission fee
    fee_discount = Column(Float, default=0.0, nullable=False)  # Recurring monthly concession/discount
    billing_cycle = Column(String(50), default="MONTHLY", nullable=False)  # MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY
    fee_due_day = Column(Integer, default=5, nullable=False)  # Day of month fee is due (e.g. 5th)
    
    paid_until_date = Column(Date, nullable=True)  # Date up to which fees are settled
    next_due_date = Column(Date, nullable=True)    # Next upcoming due date
    
    photo_url = Column(String(500), nullable=True)
    id_proof_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    fee_structure = relationship("FeeStructure", back_populates="students")
    fee_months = relationship("FeeMonth", back_populates="student", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")
    attendance_days = relationship("AttendanceDay", back_populates="student", cascade="all, delete-orphan")
    attendance_sessions = relationship("AttendanceSession", back_populates="student", cascade="all, delete-orphan")
