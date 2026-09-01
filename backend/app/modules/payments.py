from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.core.audit import log_audit
from app.models.user import User
from app.models.payment import Payment, Refund
from app.models.student import Student
from app.models.fee import FeeMonth
from app.schemas.payment import (
    PaymentCreate, PaymentResponse, ReceiptResponse, RefundCreate, FastCollectRequest
)
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments & Receipts"])

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def collect_fee_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    payment = payment_service.collect_payment(db, data, collector_user_id=staff_user.id)
    return payment_service.enrich_payment_response(payment, db)

@router.post("/fast-collect", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def fast_collect_advance(
    req: FastCollectRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    payment = payment_service.fast_collect_advance(db, req, collector_user_id=staff_user.id)
    return payment_service.enrich_payment_response(payment, db)

@router.get("", response_model=List[PaymentResponse])
def list_payments(
    student_id: Optional[int] = None,
    payment_mode: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Payment)
    
    if current_user.role == "STUDENT":
        if not current_user.student_profile:
            return []
        q = q.filter(Payment.student_id == current_user.student_profile.id)
    elif student_id:
        q = q.filter(Payment.student_id == student_id)

    if payment_mode:
        q = q.filter(Payment.payment_mode == payment_mode)

    payments = q.order_by(Payment.id.desc()).all()
    return [payment_service.enrich_payment_response(p, db) for p in payments]

@router.get("/receipt/{receipt_number}", response_model=PaymentResponse)
def get_receipt_by_number(
    receipt_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.receipt_number == receipt_number).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Receipt not found")

    if current_user.role == "STUDENT" and payment.student and payment.student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied to access other receipts")

    return payment_service.enrich_payment_response(payment, db)

@router.post("/{payment_id}/refund")
def process_payment_refund(
    payment_id: int,
    req: RefundCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["ADMIN"]))
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status == "REFUNDED":
        raise HTTPException(status_code=400, detail="Payment has already been refunded")

    payment.status = "REFUNDED"

    rf = Refund(
        payment_id=payment.id,
        refund_amount=req.refund_amount,
        reason=req.reason,
        refund_date=datetime.utcnow(),
        refunded_by_user_id=admin_user.id
    )
    db.add(rf)

    # Revert linked fee month status
    for item in payment.items:
        if item.fee_month_id:
            fm = db.query(FeeMonth).filter(FeeMonth.id == item.fee_month_id).first()
            if fm:
                fm.paid_amount = max(0.0, fm.paid_amount - item.amount)
                fm.pending_amount = max(0.0, fm.due_amount - fm.paid_amount)
                fm.status = "PENDING" if fm.paid_amount == 0 else "PARTIALLY_PAID"

    log_audit(
        db=db,
        user_id=admin_user.id,
        action="REFUND_PAYMENT",
        entity="PAYMENT",
        entity_id=str(payment.id),
        old_value={"status": "PAID", "amount": payment.total_amount},
        new_value={"status": "REFUNDED", "refund_amount": req.refund_amount, "reason": req.reason}
    )

    db.commit()
    return {"message": f"Payment #{payment.receipt_number} refunded successfully"}
