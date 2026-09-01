from datetime import date, datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.subscription import Subscription, SubscriptionHistory
from app.models.student import Student
from app.models.fee import FeeMonth, FeeStructure

def calculate_days_remaining(end_date: date) -> int:
    today = date.today()
    delta = (end_date - today).days
    return delta if delta > 0 else 0

def check_subscription_status(subscription: Subscription) -> str:
    today = date.today()
    if subscription.status == "CANCELLED" or subscription.status == "SUSPENDED":
        return subscription.status
    if today > subscription.end_date:
        return "EXPIRED"
    elif (subscription.end_date - today).days <= 7:
        return "EXPIRING_SOON"
    return "ACTIVE"

def renew_subscription(db: Session, subscription_id: int, months: int = 1) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    old_status = sub.status
    
    # Calculate new end date
    cur_end = sub.end_date if sub.end_date >= date.today() else date.today()
    m_val = ((cur_end.month - 1 + months) % 12) + 1
    y_val = cur_end.year + ((cur_end.month - 1 + months) // 12)
    new_end_date = date(y_val, m_val, min(cur_end.day, 28))

    sub.end_date = new_end_date
    sub.status = "ACTIVE"
    sub.renewal_date = date.today()

    # Subscription History
    history = SubscriptionHistory(
        subscription_id=sub.id,
        student_id=sub.student_id,
        action="RENEWED",
        old_status=old_status,
        new_status="ACTIVE",
        notes=f"Extended by {months} month(s) until {new_end_date.strftime('%Y-%m-%d')}"
    )
    db.add(history)

    # Generate FeeMonth records for extended months
    fee_struct = db.query(FeeStructure).filter(FeeStructure.id == sub.fee_structure_id).first()
    if fee_struct:
        for i in range(months):
            m_num = ((date.today().month - 1 + i) % 12) + 1
            y_num = date.today().year + ((date.today().month - 1 + i) // 12)
            
            existing = db.query(FeeMonth).filter(
                FeeMonth.student_id == sub.student_id,
                FeeMonth.year == y_num,
                FeeMonth.month == m_num
            ).first()

            if not existing:
                due_amt = max(0.0, fee_struct.monthly_fee - fee_struct.discount)
                fm = FeeMonth(
                    student_id=sub.student_id,
                    subscription_id=sub.id,
                    year=y_num,
                    month=m_num,
                    due_amount=due_amt,
                    paid_amount=0.0,
                    pending_amount=due_amt,
                    status="PENDING",
                    due_date=date(y_num, m_num, 10)
                )
                db.add(fm)

    db.commit()
    db.refresh(sub)
    return sub
