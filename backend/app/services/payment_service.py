from datetime import datetime, date, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.payment import Payment, PaymentItem, Receipt
from app.models.fee import FeeMonth, FeeStructure
from app.models.student import Student
from app.models.user import User
from app.schemas.payment import PaymentCreate, FastCollectRequest, PaymentResponse
from app.core.audit import log_audit
from app.core.utils import number_to_indian_words

MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

def generate_next_receipt_number(db: Session) -> str:
    current_year = datetime.now().year
    prefix = f"REC-{current_year}-"
    latest_payment = (
        db.query(Payment)
        .filter(Payment.receipt_number.like(f"{prefix}%"))
        .order_by(Payment.id.desc())
        .first()
    )
    if latest_payment:
        try:
            num_part = int(latest_payment.receipt_number.split("-")[-1])
            next_num = num_part + 1
        except ValueError:
            next_num = 1
    else:
        next_num = 1
    return f"{prefix}{next_num:06d}"

def enrich_payment_response(payment: Payment, db: Session) -> PaymentResponse:
    student = payment.student
    collector = db.query(User).filter(User.id == payment.collected_by_user_id).first() if payment.collected_by_user_id else None

    student_name = f"{student.first_name} {student.last_name}" if student else "Unknown Student"
    student_code = student.student_id if student else "N/A"
    student_mobile = student.mobile if student else "N/A"
    seat_number = student.seat_number if student else "General"
    preferred_timing = student.preferred_timing if student else "Full Day"
    plan_name = student.fee_structure.name if (student and student.fee_structure) else "Standard Plan"
    billing_cycle = student.billing_cycle if student else "MONTHLY"

    # Compute period covered from items or notes
    linked_months = []
    for it in payment.items:
        if it.fee_month:
            linked_months.append((it.fee_month.year, it.fee_month.month))
    
    if linked_months:
        linked_months.sort()
        start_y, start_m = linked_months[0]
        end_y, end_m = linked_months[-1]
        if start_y == end_y and start_m == end_m:
            period_covered = f"{MONTH_NAMES[start_m]} {start_y}"
        else:
            period_covered = f"{MONTH_NAMES[start_m]} {start_y} – {MONTH_NAMES[end_m]} {end_y}"
            if len(linked_months) == 12:
                period_covered += " (Annual 1-Year Coverage)"
            elif len(linked_months) == 3:
                period_covered += " (Quarterly Coverage)"
    else:
        period_covered = payment.notes or f"Fee Payment ({payment.payment_type})"

    amt_words = number_to_indian_words(payment.total_amount)
    collector_name = collector.username if collector else "Administrator"

    resp = PaymentResponse.model_validate(payment)
    resp.student_name = student_name
    resp.student_code = student_code
    resp.student_mobile = student_mobile
    resp.seat_number = seat_number
    resp.preferred_timing = preferred_timing
    resp.plan_name = plan_name
    resp.billing_cycle = billing_cycle
    resp.period_covered = period_covered
    resp.amount_in_words = amt_words
    resp.collected_by_name = collector_name
    return resp

def collect_payment(db: Session, data: PaymentCreate, collector_user_id: Optional[int]) -> Payment:
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {data.student_id} not found"
        )

    receipt_no = generate_next_receipt_number(db)

    try:
        payment = Payment(
            student_id=student.id,
            receipt_number=receipt_no,
            payment_date=datetime.utcnow(),
            total_amount=data.total_amount,
            discount_applied=data.discount_applied or 0.0,
            payment_type=data.payment_type,
            payment_mode=data.payment_mode,
            collected_by_user_id=collector_user_id,
            notes=data.notes,
            status="PAID"
        )
        db.add(payment)
        db.flush()

        paid_months_list = []
        for item_data in data.items:
            payment_item = PaymentItem(
                payment_id=payment.id,
                fee_month_id=item_data.fee_month_id,
                description=item_data.description,
                amount=item_data.amount
            )
            db.add(payment_item)

            if item_data.fee_month_id:
                fee_month = db.query(FeeMonth).filter(FeeMonth.id == item_data.fee_month_id).first()
                if fee_month:
                    fee_month.paid_amount += item_data.amount
                    fee_month.pending_amount = max(0.0, fee_month.due_amount - fee_month.paid_amount)
                    if fee_month.pending_amount == 0.0:
                        fee_month.status = "PAID"
                        fee_month.paid_date = date.today()
                        paid_months_list.append((fee_month.year, fee_month.month))
                    else:
                        fee_month.status = "PARTIALLY_PAID"
                    db.add(fee_month)

        # Update student's paid_until_date and next_due_date
        if paid_months_list:
            max_year, max_month = max(paid_months_list)
            student.paid_until_date = date(max_year, max_month, 28)
            
            # Next due date calculation
            if student.billing_cycle == "YEARLY":
                # For yearly, next due date is 1 year after
                next_y = max_year + 1
                next_m = (max_month % 12) + 1 if max_month != 12 else 1
                student.next_due_date = date(next_y, next_m, min(student.fee_due_day or 5, 28))
            elif student.billing_cycle == "QUARTERLY":
                next_m = (max_month % 12) + 1
                next_y = max_year + (1 if max_month == 12 else 0)
                student.next_due_date = date(next_y, next_m, min(student.fee_due_day or 5, 28))
            else:
                next_m = (max_month % 12) + 1
                next_y = max_year + (1 if max_month == 12 else 0)
                student.next_due_date = date(next_y, next_m, min(student.fee_due_day or 5, 28))
            
            db.add(student)

        # Generate Receipt
        receipt = Receipt(
            payment_id=payment.id,
            receipt_number=receipt_no,
            issued_at=datetime.utcnow()
        )
        db.add(receipt)
        db.flush()

        log_audit(
            db=db,
            user_id=collector_user_id,
            action="COLLECT_PAYMENT",
            entity="PAYMENT",
            entity_id=str(payment.id),
            old_value=None,
            new_value={
                "receipt_number": receipt_no,
                "amount": data.total_amount,
                "student_id": student.student_id,
                "mode": data.payment_mode
            }
        )

        db.commit()
        db.refresh(payment)
        return payment

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment transaction failed: {str(e)}"
        )

def fast_collect_advance(db: Session, req: FastCollectRequest, collector_user_id: Optional[int]) -> Payment:
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    plan = student.fee_structure
    monthly_rate = (student.custom_monthly_fee if student.custom_monthly_fee is not None else (plan.monthly_fee if plan else 0.0)) - student.fee_discount
    monthly_rate = max(0.0, monthly_rate)

    # Determine months count based on billing cycle if not specified
    months_needed = req.months_count
    if req.billing_cycle == "YEARLY" or (not req.months_count and student.billing_cycle == "YEARLY"):
        months_needed = 12
    elif req.billing_cycle == "QUARTERLY" or (not req.months_count and student.billing_cycle == "QUARTERLY"):
        months_needed = 3

    # Find pending or overdue months for this student, ordered oldest first
    pending_months = db.query(FeeMonth).filter(
        FeeMonth.student_id == student.id,
        FeeMonth.pending_amount > 0
    ).order_by(FeeMonth.year.asc(), FeeMonth.month.asc()).all()

    items_to_create = []
    total_to_charge = 0.0

    today = date.today()
    cur_y = today.year
    cur_m = today.month

    # Settle pending unpaid months first
    for pm in pending_months[:months_needed]:
        charge = pm.pending_amount
        total_to_charge += charge
        items_to_create.append({
            "fee_month_id": pm.id,
            "description": f"Fee for {MONTH_NAMES[pm.month]} {pm.year}",
            "amount": charge
        })
        months_needed -= 1

    # If more months requested in advance, create future fee month records
    if months_needed > 0:
        latest_fm = db.query(FeeMonth).filter(FeeMonth.student_id == student.id)\
            .order_by(FeeMonth.year.desc(), FeeMonth.month.desc()).first()
        
        last_y = latest_fm.year if latest_fm else cur_y
        last_m = latest_fm.month if latest_fm else (cur_m - 1)

        for i in range(1, months_needed + 1):
            nm = ((last_m - 1 + i) % 12) + 1
            ny = last_y + ((last_m - 1 + i) // 12)
            due_dt = date(ny, nm, min(student.fee_due_day or 5, 28))

            new_fm = FeeMonth(
                student_id=student.id,
                year=ny,
                month=nm,
                due_amount=monthly_rate,
                paid_amount=0.0,
                pending_amount=monthly_rate,
                discount_amount=student.fee_discount,
                status="PENDING",
                due_date=due_dt
            )
            db.add(new_fm)
            db.flush()

            total_to_charge += monthly_rate
            items_to_create.append({
                "fee_month_id": new_fm.id,
                "description": f"Advance Fee for {MONTH_NAMES[nm]} {ny}",
                "amount": monthly_rate
            })

    final_amount = req.custom_amount if req.custom_amount is not None else max(0.0, total_to_charge - req.discount_applied)

    p_type = "YEARLY" if (req.months_count >= 12 or student.billing_cycle == "YEARLY") else ("QUARTERLY" if req.months_count == 3 else ("ADVANCE" if req.months_count > 1 else "MONTHLY"))

    payment_create_data = PaymentCreate(
        student_id=student.id,
        payment_type=p_type,
        payment_mode=req.payment_mode,
        total_amount=final_amount,
        discount_applied=req.discount_applied,
        notes=req.notes or f"Fee Collection ({p_type} - {req.months_count} month(s))",
        items=items_to_create
    )

    return collect_payment(db, payment_create_data, collector_user_id)
