from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.student import Student
from app.models.payment import Payment
from app.models.fee import FeeMonth, FeeStructure
from app.models.attendance import AttendanceSession, AttendanceDay
from app.schemas.report import AdminDashboardStats, ChartDataPoint

def get_admin_dashboard_stats(db: Session) -> AdminDashboardStats:
    today = date.today()
    current_year = today.year
    current_month = today.month

    # Total active students
    total_active = db.query(Student).filter(Student.status == "ACTIVE").count()

    # New enrollments this month
    first_day_of_month = date(current_year, current_month, 1)
    new_enrollments = db.query(Student).filter(Student.enrollment_date >= first_day_of_month).count()

    # Current month fee stats
    cur_fee_months = db.query(FeeMonth).filter(FeeMonth.year == current_year, FeeMonth.month == current_month).all()
    paid_students_count = sum(1 for fm in cur_fee_months if fm.status == "PAID")
    defaulters_count = sum(1 for fm in cur_fee_months if fm.due_date < today and fm.pending_amount > 0)
    
    total_expected = sum(fm.due_amount for fm in cur_fee_months)
    total_month_paid = sum(fm.paid_amount for fm in cur_fee_months)
    collection_rate = round((total_month_paid / total_expected * 100), 1) if total_expected > 0 else 0.0

    # Today's checkins, inside, checkouts
    today_sessions = db.query(AttendanceSession).join(AttendanceDay).filter(AttendanceDay.date == today).all()
    today_checkins = len(today_sessions)
    inside_now = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").count()
    today_checkouts = len([s for s in today_sessions if s.status == "COMPLETED"])

    # Today's collections
    today_start = datetime(today.year, today.month, today.day, 0, 0, 0)
    today_payments = db.query(Payment).filter(Payment.payment_date >= today_start, Payment.status == "PAID").all()
    today_collection = sum(p.total_amount for p in today_payments)

    month_payments = db.query(Payment).filter(Payment.payment_date >= first_day_of_month, Payment.status == "PAID").all()
    this_month_collection = sum(p.total_amount for p in month_payments)

    # Pending & Overdue fees (all months)
    pending_fee_rows = db.query(FeeMonth).filter(FeeMonth.status.in_(["PENDING", "PARTIALLY_PAID"])).all()
    pending_fees = sum(f.pending_amount for f in pending_fee_rows)

    overdue_fee_rows = db.query(FeeMonth).filter(FeeMonth.status == "OVERDUE").all()
    overdue_fees = sum(f.pending_amount for f in overdue_fee_rows)

    # Monthly revenue chart (Last 6 Months)
    monthly_rev_chart = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for i in range(5, -1, -1):
        m_calc = ((current_month - 1 - i) % 12) + 1
        y_calc = current_year + ((current_month - 1 - i) // 12)
        start_m = date(y_calc, m_calc, 1)
        if m_calc == 12:
            end_m = date(y_calc + 1, 1, 1)
        else:
            end_m = date(y_calc, m_calc + 1, 1)
        
        rev = db.query(func.sum(Payment.total_amount)).filter(
            Payment.payment_date >= start_m,
            Payment.payment_date < end_m,
            Payment.status == "PAID"
        ).scalar() or 0.0

        monthly_rev_chart.append(ChartDataPoint(name=f"{month_names[m_calc - 1]} '{str(y_calc)[2:]}", value=float(rev)))

    # Daily attendance chart (Last 7 Days)
    daily_att_chart = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = db.query(AttendanceSession).join(AttendanceDay).filter(AttendanceDay.date == d).count()
        daily_att_chart.append(ChartDataPoint(name=d.strftime("%a %d"), value=float(count)))

    # Fee Status Distribution Chart
    fee_status_chart = [
        ChartDataPoint(name="Paid Up-to-date", value=float(paid_students_count)),
        ChartDataPoint(name="Pending", value=float(sum(1 for fm in cur_fee_months if fm.status == "PENDING" and fm.due_date >= today))),
        ChartDataPoint(name="Partially Paid", value=float(sum(1 for fm in cur_fee_months if fm.status == "PARTIALLY_PAID"))),
        ChartDataPoint(name="Overdue Defaulters", value=float(defaulters_count))
    ]

    return AdminDashboardStats(
        total_active_students=total_active,
        new_enrollments_this_month=new_enrollments,
        paid_students_count=paid_students_count,
        defaulters_count=defaulters_count,
        today_checkins=today_checkins,
        students_currently_inside=inside_now,
        today_checkouts=today_checkouts,
        today_collection=today_collection,
        this_month_collection=this_month_collection,
        pending_fees=pending_fees,
        overdue_fees=overdue_fees,
        collection_rate_percentage=collection_rate,
        monthly_revenue_chart=monthly_rev_chart,
        enrollment_trend_chart=monthly_rev_chart,
        daily_attendance_chart=daily_att_chart,
        fee_status_chart=fee_status_chart,
        payment_collection_chart=monthly_rev_chart
    )
