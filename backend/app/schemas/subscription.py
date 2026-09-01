from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class SubscriptionCreate(BaseModel):
    student_id: int
    fee_structure_id: int
    start_date: date
    end_date: date
    billing_frequency: str = "MONTHLY"
    fee_amount: float
    discount_amount: float = 0.0

class SubscriptionRenewRequest(BaseModel):
    months_to_extend: int = 1
    new_end_date: Optional[date] = None

class SubscriptionResponse(BaseModel):
    id: int
    student_id: int
    fee_structure_id: int
    start_date: date
    end_date: date
    status: str  # ACTIVE, EXPIRING_SOON, EXPIRED, SUSPENDED, CANCELLED
    billing_frequency: str
    fee_amount: float
    discount_amount: float
    renewal_date: Optional[date] = None
    days_remaining: int
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    plan_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
