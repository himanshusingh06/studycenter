from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from app.models.fee import FeeStructure, FeeMonth
from app.models.student import Student
from app.models.payment import Payment, PaymentItem
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureUpdate, MonthlyFeeGridItem,
    FeeAnalyticsResponse, DefaulterItem, StudentFeeProfileResponse,
    StudentFeeMappingUpdate, FeeMonthResponse, DuesListItem,
    DuesListSummary, DuesListResponse
)
from app.models.notification import Notification
from app.core.audit import log_audit

MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

def create_fee_structure(db: Session, data: FeeStructureCreate) -> FeeStructure:
    fee_struct = FeeStructure(**data.model_dump())
    db.add(fee_struct)
    db.commit()
    db.refresh(fee_struct)
    return fee_struct

def get_monthly_fee_grid(
    db: Session,
    year: int,
    month: int,
    search_query: Optional[str] = None,
    status_filter: Optional[str] = None,
    fee_structure_id: Optional[int] = None,
    timing_filter: Optional[str] = None
) -> List[MonthlyFeeGridItem]:
    today = date.today()
    target_first_day = date(year, month, 1)

    q = db.query(FeeMonth, Student, FeeStructure)\
        .join(Student, FeeMonth.student_id == Student.id)\
        .outerjoin(FeeStructure, Student.fee_structure_id == FeeStructure.id)\
        .filter(FeeMonth.year == year, FeeMonth.month == month)

    if search_query:
        sp = f"%{search_query}%"
        q = q.filter(
            or_(
                Student.student_id.ilike(sp),
                Student.first_name.ilike(sp),
                Student.last_name.ilike(sp),
                Student.mobile.ilike(sp),
                Student.seat_number.ilike(sp)
            )
        )

    if fee_structure_id:
        q = q.filter(Student.fee_structure_id == fee_structure_id)

    if timing_filter:
        q = q.filter(Student.preferred_timing == timing_filter)

    results = q.order_by(Student.first_name).all()
    grid_items = []

    for fee_m, student, fee_s in results:
        student_name = f"{student.first_name} {student.last_name}"
        plan_name = fee_s.name if fee_s else "Custom Plan"
        
        # Intelligent status sync
        if student.paid_until_date and student.paid_until_date >= target_first_day:
            if fee_m.status != "PAID" or fee_m.pending_amount > 0:
                fee_m.status = "PAID"
                fee_m.paid_amount = fee_m.due_amount
                fee_m.pending_amount = 0.0
                fee_m.paid_date = fee_m.paid_date or today
                db.add(fee_m)
        elif fee_m.status in ["PENDING", "PARTIALLY_PAID"] and fee_m.due_date < today and fee_m.pending_amount > 0:
            if fee_m.status != "OVERDUE":
                fee_m.status = "OVERDUE"
                db.add(fee_m)

        if status_filter and fee_m.status != status_filter:
            continue

        grid_items.append(
            MonthlyFeeGridItem(
                fee_month_id=fee_m.id,
                student_id=student.id,
                student_code=student.student_id,
                student_name=student_name,
                photo_url=student.photo_url,
                seat_number=student.seat_number,
                preferred_timing=student.preferred_timing,
                plan_name=plan_name,
                billing_cycle=student.billing_cycle or "MONTHLY",
                year=fee_m.year,
                month=fee_m.month,
                month_name=MONTH_NAMES[fee_m.month],
                due_amount=fee_m.due_amount,
                paid_amount=fee_m.paid_amount,
                pending_amount=fee_m.pending_amount,
                discount_amount=fee_m.discount_amount,
                status=fee_m.status,
                due_date=fee_m.due_date,
                paid_until_date=student.paid_until_date,
                next_due_date=student.next_due_date
            )
        )

    db.commit()
    return grid_items

def get_student_fee_profile(db: Session, student_id: int) -> StudentFeeProfileResponse:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student #{student_id} not found")

    today = date.today()
    plan = student.fee_structure
    plan_name = plan.name if plan else "Standard Plan"
    standard_fee = plan.monthly_fee if plan else 0.0
    effective_rate = (student.custom_monthly_fee if student.custom_monthly_fee is not None else standard_fee) - student.fee_discount
    effective_rate = max(0.0, effective_rate)
    annual_estimate = effective_rate * 12

    fee_months = db.query(FeeMonth).filter(FeeMonth.student_id == student.id).order_by(FeeMonth.year.desc(), FeeMonth.month.desc()).all()
    
    # Synchronize any fee months that are covered by paid_until_date
    for fm in fee_months:
        fm_start = date(fm.year, fm.month, 1)
        if student.paid_until_date and student.paid_until_date >= fm_start:
            if fm.status != "PAID" or fm.pending_amount > 0:
                fm.status = "PAID"
                fm.paid_amount = fm.due_amount
                fm.pending_amount = 0.0
                fm.paid_date = fm.paid_date or today
                db.add(fm)
        elif fm.status in ["PENDING", "PARTIALLY_PAID"] and fm.due_date < today and fm.pending_amount > 0:
            if fm.status != "OVERDUE":
                fm.status = "OVERDUE"
                db.add(fm)
    db.commit()

    total_paid = sum(fm.paid_amount for fm in fee_months)
    pending_dues = sum(fm.pending_amount for fm in fee_months if fm.status in ["PENDING", "PARTIALLY_PAID", "OVERDUE"])
    overdue_count = sum(1 for fm in fee_months if fm.status == "OVERDUE")

    is_settled = bool(pending_dues == 0 or (student.paid_until_date is not None and student.paid_until_date >= today))

    payments = db.query(Payment).filter(Payment.student_id == student.id).order_by(Payment.payment_date.desc()).limit(10).all()
    
    fm_responses = []
    for fm in fee_months:
        fm_responses.append(
            FeeMonthResponse(
                id=fm.id,
                student_id=student.id,
                year=fm.year,
                month=fm.month,
                due_amount=fm.due_amount,
                paid_amount=fm.paid_amount,
                pending_amount=fm.pending_amount,
                discount_amount=fm.discount_amount,
                status=fm.status,
                due_date=fm.due_date,
                paid_date=fm.paid_date,
                notes=fm.notes,
                student_name=f"{student.first_name} {student.last_name}",
                student_code=student.student_id
            )
        )

    recent_pay_data = [
        {
            "id": p.id,
            "receipt_number": p.receipt_number,
            "payment_date": p.payment_date.isoformat(),
            "total_amount": p.total_amount,
            "payment_type": p.payment_type,
            "payment_mode": p.payment_mode,
            "status": p.status
        }
        for p in payments
    ]

    return StudentFeeProfileResponse(
        student_id=student.id,
        student_code=student.student_id,
        student_name=f"{student.first_name} {student.last_name}",
        photo_url=student.photo_url,
        seat_number=student.seat_number,
        preferred_timing=student.preferred_timing,
        mobile=student.mobile,
        plan_id=student.fee_structure_id,
        plan_name=plan_name,
        standard_monthly_fee=standard_fee,
        effective_monthly_fee=effective_rate,
        annual_fee_estimate=annual_estimate,
        custom_monthly_fee=student.custom_monthly_fee,
        fee_discount=student.fee_discount,
        billing_cycle=student.billing_cycle or "MONTHLY",
        fee_due_day=student.fee_due_day or 5,
        paid_until_date=student.paid_until_date,
        next_due_date=student.next_due_date,
        is_fee_settled=is_settled,
        total_lifetime_paid=total_paid,
        current_pending_dues=pending_dues,
        overdue_months_count=overdue_count,
        fee_months=fm_responses,
        recent_payments=recent_pay_data
    )

def update_student_fee_mapping(
    db: Session,
    student_id: int,
    data: StudentFeeMappingUpdate,
    user_id: Optional[int] = None
) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student #{student_id} not found")

    old_plan = student.fee_structure_id
    if data.fee_structure_id is not None:
        student.fee_structure_id = data.fee_structure_id
    if data.custom_monthly_fee is not None:
        student.custom_monthly_fee = data.custom_monthly_fee
    if data.custom_one_time_fee is not None:
        student.custom_one_time_fee = data.custom_one_time_fee
    if data.fee_discount is not None:
        student.fee_discount = data.fee_discount
    if data.billing_cycle is not None:
        student.billing_cycle = data.billing_cycle
    if data.fee_due_day is not None:
        student.fee_due_day = data.fee_due_day

    plan = db.query(FeeStructure).filter(FeeStructure.id == student.fee_structure_id).first()
    standard_fee = plan.monthly_fee if plan else 0.0
    effective_rate = (student.custom_monthly_fee if student.custom_monthly_fee is not None else standard_fee) - student.fee_discount
    effective_rate = max(0.0, effective_rate)

    # Update unpaid pending fee months to new rate
    unpaid_months = db.query(FeeMonth).filter(
        FeeMonth.student_id == student.id,
        FeeMonth.status == "PENDING",
        FeeMonth.paid_amount == 0.0
    ).all()

    for fm in unpaid_months:
        fm.due_amount = effective_rate
        fm.pending_amount = effective_rate
        fm.discount_amount = student.fee_discount
        db.add(fm)

    log_audit(
        db=db,
        user_id=user_id,
        action="UPDATE_STUDENT_FEE_MAPPING",
        entity="STUDENT",
        entity_id=str(student.id),
        old_value={"fee_structure_id": old_plan},
        new_value={
            "fee_structure_id": student.fee_structure_id,
            "custom_monthly_fee": student.custom_monthly_fee,
            "fee_discount": student.fee_discount,
            "billing_cycle": student.billing_cycle
        }
    )

    db.commit()
    db.refresh(student)
    return student

def get_defaulters_list(db: Session, min_overdue_days: int = 1) -> List[DefaulterItem]:
    today = date.today()
    
    overdue_months = db.query(FeeMonth).join(Student)\
        .filter(
            FeeMonth.due_date < today,
            FeeMonth.pending_amount > 0,
            FeeMonth.status.in_(["PENDING", "OVERDUE", "PARTIALLY_PAID"]),
            Student.status == "ACTIVE"
        ).all()

    student_map: Dict[int, List[FeeMonth]] = {}
    for fm in overdue_months:
        st = fm.student
        fm_start = date(fm.year, fm.month, 1)
        if st.paid_until_date and st.paid_until_date >= fm_start:
            continue

        if fm.student_id not in student_map:
            student_map[fm.student_id] = []
        student_map[fm.student_id].append(fm)

    defaulters = []
    for sid, months in student_map.items():
        st = months[0].student
        plan = st.fee_structure
        plan_name = plan.name if plan else "Standard Plan"
        
        total_overdue = sum(m.pending_amount for m in months)
        oldest_due_dt = min(m.due_date for m in months)
        days_overdue = (today - oldest_due_dt).days

        if days_overdue >= min_overdue_days and total_overdue > 0:
            defaulters.append(
                DefaulterItem(
                    student_id=st.id,
                    student_code=st.student_id,
                    student_name=f"{st.first_name} {st.last_name}",
                    photo_url=st.photo_url,
                    mobile=st.mobile,
                    seat_number=st.seat_number,
                    preferred_timing=st.preferred_timing,
                    plan_name=plan_name,
                    billing_cycle=st.billing_cycle or "MONTHLY",
                    overdue_months_count=len(months),
                    total_overdue_amount=total_overdue,
                    oldest_overdue_date=oldest_due_dt,
                    days_overdue=days_overdue
                )
            )

    defaulters.sort(key=lambda d: (d.total_overdue_amount, d.days_overdue), reverse=True)
    return defaulters

def get_fee_analytics(db: Session, year: int, month: int) -> FeeAnalyticsResponse:
    today = date.today()
    month_name = MONTH_NAMES[month] if 1 <= month <= 12 else "Unknown"

    current_fee_months = db.query(FeeMonth).filter(FeeMonth.year == year, FeeMonth.month == month).all()
    
    total_expected = sum(fm.due_amount for fm in current_fee_months)
    total_collected = sum(fm.paid_amount for fm in current_fee_months)
    total_pending = sum(fm.pending_amount for fm in current_fee_months)
    
    total_overdue = sum(fm.pending_amount for fm in current_fee_months if fm.due_date < today and fm.pending_amount > 0)
    
    total_students = len(current_fee_months)
    paid_count = sum(1 for fm in current_fee_months if fm.status == "PAID" or fm.pending_amount == 0)
    pending_count = sum(1 for fm in current_fee_months if fm.pending_amount > 0)
    defaulters_count = sum(1 for fm in current_fee_months if fm.due_date < today and fm.pending_amount > 0)
    
    advance_count = db.query(Student).filter(Student.paid_until_date > date(year, month, 28)).count()

    collection_rate = round((total_collected / total_expected * 100), 1) if total_expected > 0 else 0.0

    plan_query = db.query(
        FeeStructure.name,
        func.sum(FeeMonth.paid_amount).label("collected"),
        func.count(FeeMonth.id).label("student_count")
    ).join(Student, FeeMonth.student_id == Student.id)\
     .join(FeeStructure, Student.fee_structure_id == FeeStructure.id)\
     .filter(FeeMonth.year == year, FeeMonth.month == month)\
     .group_by(FeeStructure.name).all()

    plan_distribution = [
        {"plan_name": p[0], "collected": float(p[1] or 0.0), "students": int(p[2])}
        for p in plan_query
    ]

    start_dt = datetime(year, month, 1)
    end_dt = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
    
    mode_query = db.query(
        Payment.payment_mode,
        func.sum(Payment.total_amount).label("amount"),
        func.count(Payment.id).label("count")
    ).filter(Payment.payment_date >= start_dt, Payment.payment_date < end_dt, Payment.status == "PAID")\
     .group_by(Payment.payment_mode).all()

    payment_mode_distribution = [
        {"mode": m[0], "amount": float(m[1] or 0.0), "count": int(m[2])}
        for m in mode_query
    ]

    monthly_trend = []
    for i in range(5, -1, -1):
        t_month = ((month - 1 - i) % 12) + 1
        t_year = year + ((month - 1 - i) // 12)
        
        t_collected = db.query(func.sum(FeeMonth.paid_amount))\
            .filter(FeeMonth.year == t_year, FeeMonth.month == t_month).scalar() or 0.0
        t_expected = db.query(func.sum(FeeMonth.due_amount))\
            .filter(FeeMonth.year == t_year, FeeMonth.month == t_month).scalar() or 0.0

        monthly_trend.append({
            "month": f"{MONTH_NAMES[t_month]} {t_year}",
            "collected": float(t_collected),
            "expected": float(t_expected)
        })

    recent_payments = db.query(Payment).order_by(Payment.payment_date.desc()).limit(8).all()
    recent_collections = [
        {
            "receipt_number": p.receipt_number,
            "student_name": f"{p.student.first_name} {p.student.last_name}" if p.student else "Student",
            "amount": p.total_amount,
            "mode": p.payment_mode,
            "date": p.payment_date.strftime("%d %b, %I:%M %p")
        }
        for p in recent_payments
    ]

    return FeeAnalyticsResponse(
        selected_year=year,
        selected_month=month,
        month_name=month_name,
        total_expected_revenue=round(total_expected, 2),
        total_collected_revenue=round(total_collected, 2),
        total_pending_dues=round(total_pending, 2),
        total_overdue_dues=round(total_overdue, 2),
        collection_rate_percentage=collection_rate,
        total_students_count=total_students,
        paid_students_count=paid_count,
        pending_students_count=pending_count,
        defaulters_count=defaulters_count,
        advance_paid_count=advance_count,
        plan_distribution=plan_distribution,
        payment_mode_distribution=payment_mode_distribution,
        monthly_collection_trend=monthly_trend,
        recent_collections=recent_collections
    )


def get_dues_list(
    db: Session,
    dues_type: Optional[str] = "ALL",
    search_query: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    plan_id: Optional[int] = None,
    min_days_overdue: Optional[int] = None,
    sort_by: Optional[str] = "due_date_asc"
) -> DuesListResponse:
    today = date.today()

    q = db.query(FeeMonth, Student, FeeStructure)\
        .join(Student, FeeMonth.student_id == Student.id)\
        .outerjoin(FeeStructure, Student.fee_structure_id == FeeStructure.id)\
        .filter(Student.status == "ACTIVE")

    if search_query:
        sp = f"%{search_query}%"
        q = q.filter(
            or_(
                Student.student_id.ilike(sp),
                Student.first_name.ilike(sp),
                Student.last_name.ilike(sp),
                Student.mobile.ilike(sp),
                Student.seat_number.ilike(sp)
            )
        )

    if year:
        q = q.filter(FeeMonth.year == year)

    if month:
        q = q.filter(FeeMonth.month == month)

    if plan_id:
        q = q.filter(Student.fee_structure_id == plan_id)

    raw_results = q.all()
    all_items: List[DuesListItem] = []

    total_pending_amt = 0.0
    total_overdue_amt = 0.0
    overdue_student_ids = set()
    pending_student_ids = set()
    partially_paid_count = 0
    waived_count = 0
    paid_count = 0
    overdue_days_list = []

    for fm, student, fee_s in raw_results:
        plan_name = fee_s.name if fee_s else "Custom Plan"
        student_name = f"{student.first_name} {student.last_name}"

        # Intelligent status sync
        fm_start = date(fm.year, fm.month, 1)
        if student.paid_until_date and student.paid_until_date >= fm_start and fm.status != "WAIVED":
            if fm.status != "PAID" or fm.pending_amount > 0:
                fm.status = "PAID"
                fm.paid_amount = fm.due_amount
                fm.pending_amount = 0.0
                fm.paid_date = fm.paid_date or today
                db.add(fm)
        elif fm.status in ["PENDING", "PARTIALLY_PAID"] and fm.due_date < today and fm.pending_amount > 0:
            if fm.status != "OVERDUE":
                fm.status = "OVERDUE"
                db.add(fm)

        days_overdue = (today - fm.due_date).days if (today > fm.due_date and fm.pending_amount > 0 and fm.status != "WAIVED") else 0
        days_until_due = (fm.due_date - today).days if (fm.due_date >= today and fm.pending_amount > 0) else 0

        # Global statistics accounting
        if fm.pending_amount > 0 and fm.status != "WAIVED":
            total_pending_amt += fm.pending_amount
            pending_student_ids.add(student.id)

        if (fm.status == "OVERDUE" or days_overdue > 0) and fm.pending_amount > 0 and fm.status != "WAIVED":
            total_overdue_amt += fm.pending_amount
            overdue_student_ids.add(student.id)
            if days_overdue > 0:
                overdue_days_list.append(days_overdue)

        if fm.status == "PARTIALLY_PAID":
            partially_paid_count += 1
        elif fm.status == "WAIVED":
            waived_count += 1
        elif fm.status == "PAID" or fm.pending_amount == 0:
            paid_count += 1

        # Dues type filtering
        dt_upper = (dues_type or "ALL").upper()
        if dt_upper == "OVERDUE":
            if fm.status != "OVERDUE" and days_overdue <= 0:
                continue
            if fm.pending_amount <= 0 or fm.status == "WAIVED":
                continue
        elif dt_upper == "PENDING":
            if fm.pending_amount <= 0 or fm.status == "WAIVED":
                continue
        elif dt_upper == "PARTIALLY_PAID":
            if fm.status != "PARTIALLY_PAID" and not (fm.paid_amount > 0 and fm.pending_amount > 0):
                continue
        elif dt_upper == "PAID":
            if fm.status != "PAID" and fm.pending_amount > 0:
                continue
        elif dt_upper == "WAIVED":
            if fm.status != "WAIVED":
                continue

        if min_days_overdue is not None and min_days_overdue > 0:
            if days_overdue < min_days_overdue:
                continue

        all_items.append(
            DuesListItem(
                fee_month_id=fm.id,
                student_id=student.id,
                student_code=student.student_id,
                student_name=student_name,
                photo_url=student.photo_url,
                mobile=student.mobile,
                seat_number=student.seat_number,
                preferred_timing=student.preferred_timing,
                plan_name=plan_name,
                billing_cycle=student.billing_cycle or "MONTHLY",
                year=fm.year,
                month=fm.month,
                month_name=MONTH_NAMES[fm.month],
                due_date=fm.due_date,
                due_amount=fm.due_amount,
                paid_amount=fm.paid_amount,
                pending_amount=fm.pending_amount,
                discount_amount=fm.discount_amount,
                status=fm.status,
                days_overdue=days_overdue,
                days_until_due=days_until_due,
                paid_until_date=student.paid_until_date,
                notes=fm.notes
            )
        )

    db.commit()

    # Sorting
    if sort_by == "due_date_asc":
        all_items.sort(key=lambda x: x.due_date)
    elif sort_by == "due_date_desc":
        all_items.sort(key=lambda x: x.due_date, reverse=True)
    elif sort_by == "amount_desc":
        all_items.sort(key=lambda x: x.pending_amount, reverse=True)
    elif sort_by == "overdue_days_desc":
        all_items.sort(key=lambda x: x.days_overdue, reverse=True)
    elif sort_by == "student_name":
        all_items.sort(key=lambda x: x.student_name)

    avg_days_overdue = round(sum(overdue_days_list) / len(overdue_days_list), 1) if overdue_days_list else 0.0

    summary = DuesListSummary(
        total_dues_count=len(raw_results),
        total_pending_amount=round(total_pending_amt, 2),
        total_overdue_amount=round(total_overdue_amt, 2),
        overdue_defaulters_count=len(overdue_student_ids),
        pending_students_count=len(pending_student_ids),
        partially_paid_count=partially_paid_count,
        waived_count=waived_count,
        paid_count=paid_count,
        avg_days_overdue=avg_days_overdue
    )

    return DuesListResponse(summary=summary, items=all_items)


def send_due_reminder(db: Session, student_id: int, fee_month_id: Optional[int] = None, reminder_type: str = "WHATSAPP", staff_user_id: Optional[int] = None) -> Dict[str, Any]:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student #{student_id} not found")

    fee_month = None
    if fee_month_id:
        fee_month = db.query(FeeMonth).filter(FeeMonth.id == fee_month_id).first()

    due_amt = fee_month.pending_amount if fee_month else sum(fm.pending_amount for fm in student.fee_months if fm.pending_amount > 0)
    month_str = f"{MONTH_NAMES[fee_month.month]} {fee_month.year}" if fee_month else "Pending Dues"

    msg = f"Dear {student.first_name}, this is a reminder from Buddha Library. Your fee payment of ₹{due_amt:.2f} for {month_str} is due. Please pay at the front desk or via UPI to avoid interruption."

    if student.user_id:
        notif = Notification(
            user_id=student.user_id,
            title=f"Fee Payment Reminder - {month_str}",
            message=msg,
            type="URGENT" if (fee_month and fee_month.status == "OVERDUE") else "INFO"
        )
        db.add(notif)

    log_audit(
        db=db,
        user_id=staff_user_id,
        action="SEND_FEE_REMINDER",
        entity="STUDENT",
        entity_id=str(student_id),
        new_value={"reminder_type": reminder_type, "fee_month_id": fee_month_id, "amount": due_amt}
    )

    db.commit()

    encoded_text = msg.replace(' ', '%20')
    whatsapp_url = f"https://wa.me/91{student.mobile}?text={encoded_text}" if student.mobile else None

    return {
        "success": True,
        "message": f"Payment reminder logged for {student.first_name} {student.last_name}",
        "whatsapp_url": whatsapp_url,
        "reminder_payload": {
            "student_name": f"{student.first_name} {student.last_name}",
            "mobile": student.mobile,
            "due_amount": due_amt,
            "month": month_str,
            "notice_text": msg
        }
    }


def process_bulk_dues_action(db: Session, action: str, fee_month_ids: List[int], reason: Optional[str] = None, staff_user_id: Optional[int] = None) -> Dict[str, Any]:
    if not fee_month_ids:
        return {"success": False, "message": "No dues selected"}

    fee_months = db.query(FeeMonth).filter(FeeMonth.id.in_(fee_month_ids)).all()
    count = len(fee_months)

    if action == "BULK_WAIVE":
        for fm in fee_months:
            fm.status = "WAIVED"
            fm.pending_amount = 0.0
            fm.notes = f"Waived off: {reason or 'Staff discretion'}"
            db.add(fm)

        log_audit(
            db=db,
            user_id=staff_user_id,
            action="BULK_WAIVE_FEES",
            entity="FEE_MONTH",
            entity_id=str(count),
            new_value={"waived_count": count, "reason": reason}
        )
        db.commit()
        return {"success": True, "message": f"Successfully waived {count} fee dues records."}

    elif action == "BULK_REMINDER":
        sent_count = 0
        for fm in fee_months:
            st = fm.student
            if st and st.user_id:
                notif = Notification(
                    user_id=st.user_id,
                    title=f"Urgent Fee Reminder - {MONTH_NAMES[fm.month]} {fm.year}",
                    message=f"Dear {st.first_name}, your fee payment of ₹{fm.pending_amount} is pending. Please clear your dues immediately.",
                    type="URGENT"
                )
                db.add(notif)
                sent_count += 1

        log_audit(
            db=db,
            user_id=staff_user_id,
            action="BULK_SEND_REMINDERS",
            entity="FEE_MONTH",
            entity_id=str(count),
            new_value={"selected_count": count, "notifications_sent": sent_count}
        )
        db.commit()
        return {"success": True, "message": f"Sent {sent_count} fee reminder notices to student accounts."}

    return {"success": False, "message": f"Unknown bulk action '{action}'"}

