from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.core.audit import log_audit
from app.models.user import User
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from app.services import student_service

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=StudentListResponse)
def list_students(
    q: Optional[str] = None,
    status: Optional[str] = None,
    fee_structure_id: Optional[int] = None,
    gender: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    students, total = student_service.search_students(
        db=db,
        query_str=q,
        status=status,
        fee_structure_id=fee_structure_id,
        gender=gender,
        page=page,
        page_size=page_size
    )
    return StudentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        students=students
    )

@router.get("/me", response_model=StudentResponse)
def get_my_student_profile(
    current_user: User = Depends(require_roles(["STUDENT"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not linked to user account")
    return student

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def enroll_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    student = student_service.create_student_with_account(db, data)
    return student

@router.get("/{student_id_or_code}", response_model=StudentResponse)
def get_student_detail(
    student_id_or_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = None
    if student_id_or_code.isdigit():
        student = db.query(Student).filter(Student.id == int(student_id_or_code)).first()
    if not student:
        student = db.query(Student).filter(Student.student_id == student_id_or_code).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Access control: STUDENT role can only view their own profile
    if current_user.role == "STUDENT" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied to access other student profiles")

    return student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    old_val = {"status": student.status, "seat_number": student.seat_number, "mobile": student.mobile}
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(student, key, value)

    log_audit(
        db=db,
        user_id=staff_user.id,
        action="UPDATE_STUDENT",
        entity="STUDENT",
        entity_id=str(student.id),
        old_value=old_val,
        new_value={"status": student.status, "seat_number": student.seat_number}
    )

    db.commit()
    db.refresh(student)
    return student

@router.delete("/{student_id}")
def deactivate_student(
    student_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.status = "INACTIVE"
    if student.user:
        student.user.is_active = False

    log_audit(
        db=db,
        user_id=staff_user.id,
        action="DEACTIVATE_STUDENT",
        entity="STUDENT",
        entity_id=str(student.id),
        old_value={"status": "ACTIVE"},
        new_value={"status": "INACTIVE"}
    )

    db.commit()
    return {"message": f"Student '{student.student_id}' has been deactivated"}
