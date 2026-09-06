from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.core.audit import log_audit
from app.models.user import User
from app.models.student import Student
from app.models.fee import FeeStructure, FeeMonth
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse, 
    MonthlyFeeGridItem, FeeAnalyticsResponse, DefaulterItem,
    StudentFeeProfileResponse, StudentFeeMappingUpdate,
    DuesListResponse, SendReminderRequest, BulkDuesActionRequest
)
from app.services import fee_service

router = APIRouter(prefix="/fees", tags=["Fee Management"])

class UpdateFeeMonthRequest(BaseModel):
    due_amount: Optional[float] = None
    paid_amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[date] = None

@router.get("/structures", response_model=List[FeeStructureResponse])
def get_fee_structures(db: Session = Depends(get_db)):
    return db.query(FeeStructure).order_by(FeeStructure.id).all()

@router.post("/structures", response_model=FeeStructureResponse, status_code=status.HTTP_201_CREATED)
def create_fee_structure(
    data: FeeStructureCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(["ADMIN"]))
):
    existing = db.query(FeeStructure).filter(FeeStructure.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fee structure with this name already exists")
    return fee_service.create_fee_structure(db, data)

@router.put("/structures/{fee_id}", response_model=FeeStructureResponse)
def update_fee_structure(
    fee_id: int,
    data: FeeStructureUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(["ADMIN"]))
):
    fee_struct = db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()
    if not fee_struct:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(fee_struct, k, v)

    db.commit()
    db.refresh(fee_struct)
    return fee_struct

@router.delete("/structures/{fee_id}")
def deactivate_fee_structure(
    fee_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(["ADMIN"]))
):
    fee_struct = db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()
    if not fee_struct:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    fee_struct.is_active = False
    log_audit(
        db=db,
        user_id=admin.id,
        action="DEACTIVATE_FEE_STRUCTURE",
        entity="FEE_STRUCTURE",
        entity_id=str(fee_id),
        old_value={"is_active": True},
        new_value={"is_active": False}
    )
    db.commit()
    return {"message": "Fee structure deactivated"}

@router.get("/monthly-grid", response_model=List[MonthlyFeeGridItem])
def get_monthly_fee_grid(
    year: int = Query(default=datetime.now().year),
    month: int = Query(default=datetime.now().month, ge=1, le=12),
    q: Optional[str] = None,
    status: Optional[str] = None,
    plan_id: Optional[int] = None,
    timing: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    items = fee_service.get_monthly_fee_grid(
        db=db,
        year=year,
        month=month,
        search_query=q,
        status_filter=status,
        fee_structure_id=plan_id,
        timing_filter=timing
    )
    return items

@router.put("/monthly-grid/{fee_month_id}")
def update_fee_month(
    fee_month_id: int,
    req: UpdateFeeMonthRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    fm = db.query(FeeMonth).filter(FeeMonth.id == fee_month_id).first()
    if not fm:
        raise HTTPException(status_code=404, detail="Fee month record not found")

    old_val = {"due_amount": fm.due_amount, "paid_amount": fm.paid_amount, "status": fm.status}

    if req.due_amount is not None:
        fm.due_amount = req.due_amount
    if req.paid_amount is not None:
        fm.paid_amount = req.paid_amount
    fm.pending_amount = max(0.0, fm.due_amount - fm.paid_amount)
    if req.status is not None:
        fm.status = req.status
    elif fm.pending_amount == 0.0:
        fm.status = "PAID"
        fm.paid_date = date.today()
    elif fm.paid_amount > 0:
        fm.status = "PARTIALLY_PAID"

    if req.due_date is not None:
        fm.due_date = req.due_date

    log_audit(
        db=db,
        user_id=staff_user.id,
        action="UPDATE_FEE_MONTH",
        entity="FEE_MONTH",
        entity_id=str(fm.id),
        old_value=old_val,
        new_value={"due_amount": fm.due_amount, "paid_amount": fm.paid_amount, "status": fm.status}
    )

    db.commit()
    return {"message": "Fee month updated successfully"}

@router.get("/analytics", response_model=FeeAnalyticsResponse)
def get_fee_analytics(
    year: int = Query(default=datetime.now().year),
    month: int = Query(default=datetime.now().month, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    return fee_service.get_fee_analytics(db, year, month)

@router.get("/defaulters", response_model=List[DefaulterItem])
def get_defaulters(
    min_days: int = Query(default=1, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    return fee_service.get_defaulters_list(db, min_days)

@router.get("/student/{student_id}", response_model=StudentFeeProfileResponse)
def get_student_fee_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student #{student_id} not found")
    return fee_service.get_student_fee_profile(db, student_id)

@router.put("/student/{student_id}/mapping")
def update_student_fee_mapping(
    student_id: int,
    data: StudentFeeMappingUpdate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student #{student_id} not found")
    st = fee_service.update_student_fee_mapping(db, student_id, data, user_id=staff_user.id)
    return {"message": f"Fee plan mapping updated for {st.first_name} {st.last_name}"}

@router.get("/my-dues")
def get_my_fee_dues(
    current_user: User = Depends(require_roles(["STUDENT"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not linked")

    months = db.query(FeeMonth).filter(FeeMonth.student_id == student.id).order_by(FeeMonth.year.desc(), FeeMonth.month.desc()).all()
    
    MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    res = []
    for fm in months:
        res.append({
            "id": fm.id,
            "year": fm.year,
            "month": fm.month,
            "month_name": MONTH_NAMES[fm.month],
            "due_amount": fm.due_amount,
            "paid_amount": fm.paid_amount,
            "pending_amount": fm.pending_amount,
            "discount_amount": fm.discount_amount,
            "status": fm.status,
            "due_date": str(fm.due_date),
            "paid_date": str(fm.paid_date) if fm.paid_date else None
        })
    return res

@router.get("/dues-list", response_model=DuesListResponse)
def get_dues_list(
    dues_type: Optional[str] = Query(default="ALL"),
    q: Optional[str] = Query(default=None),
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    plan_id: Optional[int] = Query(default=None),
    min_days: Optional[int] = Query(default=None, ge=0),
    sort_by: Optional[str] = Query(default="due_date_asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    return fee_service.get_dues_list(
        db=db,
        dues_type=dues_type,
        search_query=q,
        year=year,
        month=month,
        plan_id=plan_id,
        min_days_overdue=min_days,
        sort_by=sort_by
    )

@router.post("/dues/send-reminder")
def send_due_reminder(
    req: SendReminderRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    try:
        return fee_service.send_due_reminder(
            db=db,
            student_id=req.student_id,
            fee_month_id=req.fee_month_id,
            reminder_type=req.reminder_type,
            staff_user_id=staff_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/dues/bulk-action")
def process_bulk_dues_action(
    req: BulkDuesActionRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    return fee_service.process_bulk_dues_action(
        db=db,
        action=req.action,
        fee_month_ids=req.fee_month_ids,
        reason=req.reason,
        staff_user_id=staff_user.id
    )

