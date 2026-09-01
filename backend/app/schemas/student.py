from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import date, datetime

class StudentCreate(BaseModel):
    # Personal
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    mobile: str
    alt_mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    # Guardian
    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    guardian_mobile: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_address: Optional[str] = None

    # Academic
    course: Optional[str] = None
    college: Optional[str] = None
    qualification: Optional[str] = None
    academic_year: Optional[str] = None

    # Emergency
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_relation: Optional[str] = None

    # Study Center & Fee Configuration
    enrollment_date: Optional[date] = None
    joining_date: Optional[date] = None
    seat_number: Optional[str] = None
    preferred_timing: Optional[str] = None
    
    # Direct Fee Mapping
    fee_structure_id: Optional[int] = None
    custom_monthly_fee: Optional[float] = None
    custom_one_time_fee: Optional[float] = None
    fee_discount: Optional[float] = 0.0
    billing_cycle: Optional[str] = "MONTHLY"
    fee_due_day: Optional[int] = 5
    
    photo_url: Optional[str] = None
    id_proof_url: Optional[str] = None

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    mobile: Optional[str] = None
    alt_mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    guardian_mobile: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_address: Optional[str] = None

    course: Optional[str] = None
    college: Optional[str] = None
    qualification: Optional[str] = None
    academic_year: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_relation: Optional[str] = None

    seat_number: Optional[str] = None
    preferred_timing: Optional[str] = None
    status: Optional[str] = None
    
    # Direct Fee Mapping
    fee_structure_id: Optional[int] = None
    custom_monthly_fee: Optional[float] = None
    custom_one_time_fee: Optional[float] = None
    fee_discount: Optional[float] = None
    billing_cycle: Optional[str] = None
    fee_due_day: Optional[int] = None
    paid_until_date: Optional[date] = None
    next_due_date: Optional[date] = None

    photo_url: Optional[str] = None
    id_proof_url: Optional[str] = None

class FeeStructureBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    one_time_fee: float
    monthly_fee: float
    discount: float

class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: str
    user_id: Optional[int] = None
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    mobile: str
    alt_mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    guardian_mobile: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_address: Optional[str] = None

    course: Optional[str] = None
    college: Optional[str] = None
    qualification: Optional[str] = None
    academic_year: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_relation: Optional[str] = None

    enrollment_date: date
    joining_date: date
    seat_number: Optional[str] = None
    preferred_timing: Optional[str] = None
    status: str
    
    # Direct Fee Mapping
    fee_structure_id: Optional[int] = None
    fee_structure: Optional[FeeStructureBrief] = None
    custom_monthly_fee: Optional[float] = None
    custom_one_time_fee: Optional[float] = None
    fee_discount: float
    billing_cycle: str
    fee_due_day: int
    paid_until_date: Optional[date] = None
    next_due_date: Optional[date] = None
    
    photo_url: Optional[str] = None
    id_proof_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    students: List[StudentResponse]
