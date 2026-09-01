from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class CheckInRequest(BaseModel):
    student_identifier: str  # student_id e.g. STU-2026-00001, database id, or QR code token
    source: str = "DESK"  # DESK, QR_CODE, MANUAL
    notes: Optional[str] = None

class CheckOutRequest(BaseModel):
    student_identifier: str
    notes: Optional[str] = None

class AttendanceSessionResponse(BaseModel):
    id: int
    student_id: int
    student_code: str
    student_name: str
    student_photo: Optional[str] = None
    seat_number: Optional[str] = None
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    duration_seconds: int
    duration_formatted: str
    source: str
    status: str  # ACTIVE, COMPLETED, CANCELLED, CORRECTED
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceDayResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_code: str
    date: date
    total_seconds: int
    total_hours_formatted: str
    session_count: int
    sessions: List[AttendanceSessionResponse] = []

    class Config:
        from_attributes = True

class OccupancyStats(BaseModel):
    currently_inside: int
    today_total_visits: int
    today_unique_students: int
    today_total_seconds: int
    today_total_hours_formatted: str
    average_session_minutes: float
    peak_hour: str
