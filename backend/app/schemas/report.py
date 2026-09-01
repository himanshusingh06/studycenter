from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional

class MetricCard(BaseModel):
    title: str
    value: Any
    change: Optional[str] = None
    trend: Optional[str] = None  # up, down, neutral

class ChartDataPoint(BaseModel):
    name: str
    value: float
    secondary_value: Optional[float] = None

class AdminDashboardStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_active_students: int
    new_enrollments_this_month: int
    paid_students_count: int
    defaulters_count: int
    today_checkins: int
    students_currently_inside: int
    today_checkouts: int
    today_collection: float
    this_month_collection: float
    pending_fees: float
    overdue_fees: float
    collection_rate_percentage: float
    
    monthly_revenue_chart: List[ChartDataPoint]
    enrollment_trend_chart: List[ChartDataPoint]
    daily_attendance_chart: List[ChartDataPoint]
    fee_status_chart: List[ChartDataPoint]
    payment_collection_chart: List[ChartDataPoint]
