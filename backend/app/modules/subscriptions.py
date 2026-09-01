from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.core.audit import log_audit
from app.models.user import User
from app.models.subscription import Subscription
from app.models.student import Student
from app.schemas.subscription import SubscriptionResponse, SubscriptionRenewRequest
from app.services import subscription_service

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

class UpdateSubscriptionRequest(BaseModel):
    end_date: Optional[date] = None
    status: Optional[str] = None
    fee_amount: Optional[float] = None

@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(
    status: Optional[str] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    q = db.query(Subscription)
    if student_id:
        q = q.filter(Subscription.student_id == student_id)

    subs = q.order_by(Subscription.id.desc()).all()
    res = []
    for s in subs:
        cur_status = subscription_service.check_subscription_status(s)
        if s.status != cur_status and s.status not in ["CANCELLED", "SUSPENDED"]:
            s.status = cur_status
            db.add(s)
            db.flush()

        if status and s.status != status:
            continue

        days_rem = subscription_service.calculate_days_remaining(s.end_date)
        s_res = SubscriptionResponse(
            id=s.id,
            student_id=s.student_id,
            fee_structure_id=s.fee_structure_id,
            start_date=s.start_date,
            end_date=s.end_date,
            status=s.status,
            billing_frequency=s.billing_frequency,
            fee_amount=s.fee_amount,
            discount_amount=s.discount_amount,
            renewal_date=s.renewal_date,
            days_remaining=days_rem,
            student_name=f"{s.student.first_name} {s.student.last_name}" if s.student else None,
            student_code=s.student.student_id if s.student else None,
            plan_name=s.fee_structure.name if s.fee_structure else None,
            created_at=s.created_at
        )
        res.append(s_res)

    db.commit()
    return res

@router.post("/{subscription_id}/renew", response_model=SubscriptionResponse)
def renew_subscription(
    subscription_id: int,
    req: SubscriptionRenewRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    sub = subscription_service.renew_subscription(db, subscription_id, req.months_to_extend)
    days_rem = subscription_service.calculate_days_remaining(sub.end_date)
    return SubscriptionResponse(
        id=sub.id,
        student_id=sub.student_id,
        fee_structure_id=sub.fee_structure_id,
        start_date=sub.start_date,
        end_date=sub.end_date,
        status=sub.status,
        billing_frequency=sub.billing_frequency,
        fee_amount=sub.fee_amount,
        discount_amount=sub.discount_amount,
        renewal_date=sub.renewal_date,
        days_remaining=days_rem,
        student_name=f"{sub.student.first_name} {sub.student.last_name}" if sub.student else None,
        student_code=sub.student.student_id if sub.student else None,
        plan_name=sub.fee_structure.name if sub.fee_structure else None,
        created_at=sub.created_at
    )

@router.put("/{subscription_id}", response_model=SubscriptionResponse)
def update_subscription(
    subscription_id: int,
    req: UpdateSubscriptionRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    old_val = {"status": sub.status, "end_date": str(sub.end_date)}
    if req.end_date:
        sub.end_date = req.end_date
    if req.status:
        sub.status = req.status
    if req.fee_amount is not None:
        sub.fee_amount = req.fee_amount

    log_audit(
        db=db,
        user_id=staff_user.id,
        action="UPDATE_SUBSCRIPTION",
        entity="SUBSCRIPTION",
        entity_id=str(sub.id),
        old_value=old_val,
        new_value={"status": sub.status, "end_date": str(sub.end_date)}
    )

    db.commit()
    db.refresh(sub)
    days_rem = subscription_service.calculate_days_remaining(sub.end_date)
    return SubscriptionResponse(
        id=sub.id,
        student_id=sub.student_id,
        fee_structure_id=sub.fee_structure_id,
        start_date=sub.start_date,
        end_date=sub.end_date,
        status=sub.status,
        billing_frequency=sub.billing_frequency,
        fee_amount=sub.fee_amount,
        discount_amount=sub.discount_amount,
        renewal_date=sub.renewal_date,
        days_remaining=days_rem,
        student_name=f"{sub.student.first_name} {sub.student.last_name}" if sub.student else None,
        student_code=sub.student.student_id if sub.student else None,
        plan_name=sub.fee_structure.name if sub.fee_structure else None,
        created_at=sub.created_at
    )

@router.delete("/{subscription_id}")
def cancel_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.status = "CANCELLED"
    log_audit(
        db=db,
        user_id=staff_user.id,
        action="CANCEL_SUBSCRIPTION",
        entity="SUBSCRIPTION",
        entity_id=str(sub.id),
        old_value={"status": "ACTIVE"},
        new_value={"status": "CANCELLED"}
    )
    db.commit()
    return {"message": "Subscription cancelled successfully"}
