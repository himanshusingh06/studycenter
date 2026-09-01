from datetime import datetime, date, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from fastapi import HTTPException, status
from app.models.attendance import AttendanceDay, AttendanceSession
from app.models.student import Student
from app.schemas.attendance import CheckInRequest, CheckOutRequest, OccupancyStats
from app.core.audit import log_audit

def format_duration(seconds: int) -> str:
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"

def get_student_by_identifier(db: Session, identifier: str) -> Student:
    student = db.query(Student).filter(
        or_(
            Student.student_id == identifier,
            Student.mobile == identifier,
            Student.email == identifier
        )
    ).first()
    if not student and identifier.isdigit():
        student = db.query(Student).filter(Student.id == int(identifier)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with identifier '{identifier}' not found"
        )
    return student

def check_in_student(db: Session, req: CheckInRequest, user_id: Optional[int]) -> AttendanceSession:
    student = get_student_by_identifier(db, req.student_identifier)

    # Check if student subscription or status is suspended
    if student.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check in: Student status is '{student.status}'"
        )

    # Enforce constraint: Can ONLY have one ACTIVE session at a time
    active_session = db.query(AttendanceSession).filter(
        AttendanceSession.student_id == student.id,
        AttendanceSession.status == "ACTIVE"
    ).first()

    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student '{student.first_name} {student.last_name}' ({student.student_id}) is ALREADY checked in."
        )

    today = date.today()
    now = datetime.utcnow()

    # Get or create AttendanceDay record for today
    att_day = db.query(AttendanceDay).filter(
        AttendanceDay.student_id == student.id,
        AttendanceDay.date == today
    ).first()

    if not att_day:
        att_day = AttendanceDay(
            student_id=student.id,
            date=today,
            total_seconds=0,
            session_count=0
        )
        db.add(att_day)
        db.flush()

    # Create new ACTIVE AttendanceSession
    new_session = AttendanceSession(
        student_id=student.id,
        attendance_day_id=att_day.id,
        check_in_time=now,
        check_out_time=None,
        duration_seconds=0,
        checked_in_by_user_id=user_id,
        source=req.source,
        status="ACTIVE",
        notes=req.notes
    )
    db.add(new_session)
    
    att_day.session_count += 1
    db.add(att_day)

    log_audit(
        db=db,
        user_id=user_id,
        action="CHECK_IN",
        entity="ATTENDANCE",
        entity_id=str(new_session.id),
        old_value=None,
        new_value={"student_id": student.student_id, "check_in_time": str(now)}
    )

    db.commit()
    db.refresh(new_session)
    return new_session

def check_out_student(db: Session, req: CheckOutRequest, user_id: Optional[int]) -> AttendanceSession:
    student = get_student_by_identifier(db, req.student_identifier)

    # Find the active session for this student
    active_session = db.query(AttendanceSession).filter(
        AttendanceSession.student_id == student.id,
        AttendanceSession.status == "ACTIVE"
    ).first()

    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check out: Student '{student.first_name} {student.last_name}' ({student.student_id}) has no active check-in session."
        )

    now = datetime.utcnow()
    duration_sec = int((now - active_session.check_in_time).total_seconds())
    if duration_sec < 0:
        duration_sec = 0

    active_session.check_out_time = now
    active_session.duration_seconds = duration_sec
    active_session.status = "COMPLETED"
    active_session.checked_out_by_user_id = user_id
    if req.notes:
        active_session.notes = (active_session.notes or "") + f" | Checkout Note: {req.notes}"

    # Update AttendanceDay total seconds
    att_day = db.query(AttendanceDay).filter(AttendanceDay.id == active_session.attendance_day_id).first()
    if att_day:
        att_day.total_seconds += duration_sec
        db.add(att_day)

    log_audit(
        db=db,
        user_id=user_id,
        action="CHECK_OUT",
        entity="ATTENDANCE",
        entity_id=str(active_session.id),
        old_value={"check_in_time": str(active_session.check_in_time)},
        new_value={"check_out_time": str(now), "duration_seconds": duration_sec}
    )

    db.commit()
    db.refresh(active_session)
    return active_session

def update_attendance_session(
    db: Session,
    session_id: int,
    notes: Optional[str] = None,
    new_status: Optional[str] = None,
    user_id: Optional[int] = None
) -> AttendanceSession:
    sess = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    old_val = {"status": sess.status, "notes": sess.notes}
    if notes is not None:
        sess.notes = notes
    if new_status is not None:
        sess.status = new_status

    log_audit(
        db=db,
        user_id=user_id,
        action="UPDATE_ATTENDANCE_SESSION",
        entity="ATTENDANCE",
        entity_id=str(sess.id),
        old_value=old_val,
        new_value={"status": sess.status, "notes": sess.notes}
    )

    db.commit()
    db.refresh(sess)
    return sess

def delete_attendance_session(db: Session, session_id: int, user_id: Optional[int]) -> bool:
    sess = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    # Subtract duration from attendance day if completed
    if sess.status == "COMPLETED" and sess.attendance_day:
        sess.attendance_day.total_seconds = max(0, sess.attendance_day.total_seconds - sess.duration_seconds)
        sess.attendance_day.session_count = max(0, sess.attendance_day.session_count - 1)

    log_audit(
        db=db,
        user_id=user_id,
        action="DELETE_ATTENDANCE_SESSION",
        entity="ATTENDANCE",
        entity_id=str(session_id),
        old_value={"student_id": sess.student_id, "check_in_time": str(sess.check_in_time)},
        new_value=None
    )

    db.delete(sess)
    db.commit()
    return True

def get_occupancy_stats(db: Session) -> OccupancyStats:
    today = date.today()
    
    # 1. Currently inside
    currently_inside = db.query(AttendanceSession).filter(
        AttendanceSession.status == "ACTIVE"
    ).count()

    # 2. Today's total visits (sessions)
    today_sessions = db.query(AttendanceSession).join(AttendanceDay)\
        .filter(AttendanceDay.date == today).all()
    today_total_visits = len(today_sessions)

    # 3. Unique students today
    today_unique_students = db.query(AttendanceDay.student_id)\
        .filter(AttendanceDay.date == today).distinct().count()

    # 4. Total seconds studied today
    total_sec = sum(s.duration_seconds for s in today_sessions if s.status == "COMPLETED")
    
    # Average session minutes
    completed_sessions = [s for s in today_sessions if s.status == "COMPLETED"]
    avg_minutes = (sum(s.duration_seconds for s in completed_sessions) / len(completed_sessions) / 60) if completed_sessions else 0.0

    return OccupancyStats(
        currently_inside=currently_inside,
        today_total_visits=today_total_visits,
        today_unique_students=today_unique_students,
        today_total_seconds=total_sec,
        today_total_hours_formatted=format_duration(total_sec),
        average_session_minutes=round(avg_minutes, 1),
        peak_hour="10:00 AM - 1:00 PM"
    )
