from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PaymentItemCreate(BaseModel):
    fee_month_id: Optional[int] = None
    description: str
    amount: float

class PaymentCreate(BaseModel):
    student_id: int
    payment_type: str = "MONTHLY"  # ONE_TIME, MONTHLY, ADVANCE, YEARLY, QUARTERLY, CUSTOM
    payment_mode: str = "UPI"      # CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, OTHER
    total_amount: float
    discount_applied: Optional[float] = 0.0
    items: List[PaymentItemCreate]
    notes: Optional[str] = None

class FastCollectRequest(BaseModel):
    student_id: int
    months_count: int = 1         # 1 for Monthly, 3 for Quarterly, 12 for Yearly, or custom
    billing_cycle: Optional[str] = None  # MONTHLY, QUARTERLY, YEARLY
    custom_amount: Optional[float] = None
    discount_applied: float = 0.0
    payment_mode: str = "UPI"
    notes: Optional[str] = None

class PaymentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    payment_id: int
    fee_month_id: Optional[int] = None
    description: str
    amount: float

class ReceiptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    payment_id: int
    receipt_number: str
    pdf_url: Optional[str] = None
    issued_at: datetime

class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    receipt_number: str
    payment_date: datetime
    total_amount: float
    discount_applied: float = 0.0
    payment_type: str
    payment_mode: str
    collected_by_user_id: Optional[int] = None
    collected_by_name: Optional[str] = None
    notes: Optional[str] = None
    status: str
    
    # Rich Student & Receipt Details for Advanced Printing
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    student_mobile: Optional[str] = None
    seat_number: Optional[str] = None
    preferred_timing: Optional[str] = None
    plan_name: Optional[str] = None
    billing_cycle: Optional[str] = None
    period_covered: Optional[str] = None
    amount_in_words: Optional[str] = None
    
    items: List[PaymentItemResponse] = []
    receipt: Optional[ReceiptResponse] = None

class RefundCreate(BaseModel):
    refund_amount: float
    reason: str
