from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.user import User
from app.models.student import Student
from app.models.attendance import AttendanceSession, AttendanceDay
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, AttendanceSessionResponse, 
    AttendanceDayResponse, OccupancyStats
)
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])

class UpdateSessionRequest(BaseModel):
    notes: Optional[str] = None
    status: Optional[str] = None

def format_session_response(s: AttendanceSession) -> AttendanceSessionResponse:
    dur_str = attendance_service.format_duration(s.duration_seconds)
    st = s.student
    return AttendanceSessionResponse(
        id=s.id,
        student_id=s.student_id,
        student_code=st.student_id if st else "",
        student_name=f"{st.first_name} {st.last_name}" if st else "",
        student_photo=st.photo_url if st else None,
        seat_number=st.seat_number if st else None,
        check_in_time=s.check_in_time,
        check_out_time=s.check_out_time,
        duration_seconds=s.duration_seconds,
        duration_formatted=dur_str,
        source=s.source,
        status=s.status,
        notes=s.notes
    )

@router.post("/check-in", response_model=AttendanceSessionResponse)
def check_in(
    req: CheckInRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    session = attendance_service.check_in_student(db, req, user_id=staff_user.id)
    return format_session_response(session)

@router.post("/check-out", response_model=AttendanceSessionResponse)
def check_out(
    req: CheckOutRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    session = attendance_service.check_out_student(db, req, user_id=staff_user.id)
    return format_session_response(session)

@router.put("/sessions/{session_id}", response_model=AttendanceSessionResponse)
def update_session(
    session_id: int,
    req: UpdateSessionRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    sess = attendance_service.update_attendance_session(
        db, session_id, notes=req.notes, new_status=req.status, user_id=staff_user.id
    )
    return format_session_response(sess)

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    attendance_service.delete_attendance_session(db, session_id, user_id=staff_user.id)
    return {"message": "Attendance session deleted successfully"}

@router.get("/occupancy", response_model=OccupancyStats)
def get_occupancy(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    return attendance_service.get_occupancy_stats(db)

@router.get("/active-sessions", response_model=List[AttendanceSessionResponse])
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    sessions = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").order_by(AttendanceSession.check_in_time.desc()).all()
    return [format_session_response(s) for s in sessions]

@router.get("/sessions", response_model=List[AttendanceSessionResponse])
def get_sessions_history(
    date_val: Optional[date] = Query(default=None),
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(AttendanceSession)
    
    # If student role, restrict strictly to own student_id
    if current_user.role == "STUDENT":
        if not current_user.student_profile:
            return []
        q = q.filter(AttendanceSession.student_id == current_user.student_profile.id)
    elif student_id:
        q = q.filter(AttendanceSession.student_id == student_id)

    if date_val:
        q = q.join(AttendanceDay).filter(AttendanceDay.date == date_val)

    sessions = q.order_by(AttendanceSession.id.desc()).all()
    return [format_session_response(s) for s in sessions]

@router.get("/my-summary")
def get_my_attendance_summary(
    current_user: User = Depends(require_roles(["STUDENT"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not linked")

    sessions = db.query(AttendanceSession).filter(AttendanceSession.student_id == student.id).order_by(AttendanceSession.id.desc()).all()
    completed = [s for s in sessions if s.status == "COMPLETED"]
    
    total_seconds = sum(s.duration_seconds for s in completed)
    total_visits = len(completed)
    avg_seconds = (total_seconds // total_visits) if total_visits > 0 else 0

    active_session = db.query(AttendanceSession).filter(
        AttendanceSession.student_id == student.id,
        AttendanceSession.status == "ACTIVE"
    ).first()

    return {
        "student_id": student.student_id,
        "total_visits": total_visits,
        "total_study_seconds": total_seconds,
        "total_study_hours_formatted": attendance_service.format_duration(total_seconds),
        "average_session_formatted": attendance_service.format_duration(avg_seconds),
        "is_currently_inside": active_session is not None,
        "active_session": format_session_response(active_session) if active_session else None,
        "recent_sessions": [format_session_response(s) for s in sessions[:20]]
    }
