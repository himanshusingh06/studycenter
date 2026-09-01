from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class FeeStructureCreate(BaseModel):
    name: str
    description: Optional[str] = None
    one_time_fee: float = 0.0
    monthly_fee: float = 0.0
    custom_charges: float = 0.0
    discount: float = 0.0
    late_fee: float = 0.0
    validity_months: int = 12
    is_active: bool = True

class FeeStructureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    one_time_fee: Optional[float] = None
    monthly_fee: Optional[float] = None
    custom_charges: Optional[float] = None
    discount: Optional[float] = None
    late_fee: Optional[float] = None
    validity_months: Optional[int] = None
    is_active: Optional[bool] = None

class FeeStructureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    one_time_fee: float
    monthly_fee: float
    custom_charges: float
    discount: float
    late_fee: float
    validity_months: int
    is_active: bool
    created_at: datetime

class FeeMonthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    year: int
    month: int
    due_amount: float
    paid_amount: float
    pending_amount: float
    discount_amount: float = 0.0
    status: str  # PENDING, PARTIALLY_PAID, PAID, OVERDUE, WAIVED, CANCELLED
    due_date: date
    paid_date: Optional[date] = None
    notes: Optional[str] = None
    student_name: Optional[str] = None
    student_code: Optional[str] = None

class MonthlyFeeGridItem(BaseModel):
    fee_month_id: int
    student_id: int
    student_code: str
    student_name: str
    photo_url: Optional[str] = None
    seat_number: Optional[str] = None
    preferred_timing: Optional[str] = None
    plan_name: str
    billing_cycle: str = "MONTHLY"  # MONTHLY, YEARLY, QUARTERLY
    year: int
    month: int
    month_name: str
    due_amount: float
    paid_amount: float
    pending_amount: float
    discount_amount: float = 0.0
    status: str
    due_date: date
    paid_until_date: Optional[date] = None
    next_due_date: Optional[date] = None

class StudentFeeMappingUpdate(BaseModel):
    fee_structure_id: Optional[int] = None
    custom_monthly_fee: Optional[float] = None
    custom_one_time_fee: Optional[float] = None
    fee_discount: Optional[float] = 0.0
    billing_cycle: Optional[str] = "MONTHLY"
    fee_due_day: Optional[int] = 5

class StudentFeeProfileResponse(BaseModel):
    student_id: int
    student_code: str
    student_name: str
    photo_url: Optional[str] = None
    seat_number: Optional[str] = None
    preferred_timing: Optional[str] = None
    mobile: str
    plan_id: Optional[int] = None
    plan_name: str
    standard_monthly_fee: float
    effective_monthly_fee: float
    annual_fee_estimate: float
    custom_monthly_fee: Optional[float] = None
    fee_discount: float
    billing_cycle: str
    fee_due_day: int
    paid_until_date: Optional[date] = None
    next_due_date: Optional[date] = None
    is_fee_settled: bool
    total_lifetime_paid: float
    current_pending_dues: float
    overdue_months_count: int
    fee_months: List[FeeMonthResponse]
    recent_payments: List[Any]

class DefaulterItem(BaseModel):
    student_id: int
    student_code: str
    student_name: str
    photo_url: Optional[str] = None
    mobile: str
    seat_number: Optional[str] = None
    preferred_timing: Optional[str] = None
    plan_name: str
    billing_cycle: str
    overdue_months_count: int
    total_overdue_amount: float
    oldest_overdue_date: date
    days_overdue: int

class FeeAnalyticsResponse(BaseModel):
    selected_year: int
    selected_month: int
    month_name: str
    total_expected_revenue: float
    total_collected_revenue: float
    total_pending_dues: float
    total_overdue_dues: float
    collection_rate_percentage: float
    total_students_count: int
    paid_students_count: int
    pending_students_count: int
    defaulters_count: int
    advance_paid_count: int
    plan_distribution: List[Dict[str, Any]]
    payment_mode_distribution: List[Dict[str, Any]]
    monthly_collection_trend: List[Dict[str, Any]]
    recent_collections: List[Dict[str, Any]]
