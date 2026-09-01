import sys
import os
from datetime import date, datetime, timedelta
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.student import Student
from app.models.fee import FeeStructure, FeeMonth
from app.models.payment import Payment, PaymentItem, Receipt
from app.models.attendance import AttendanceDay, AttendanceSession
from app.models.audit import AuditLog

MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

def seed_database():
    print("Recreating database tables in PostgreSQL...")
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
            conn.commit()
            print("Cleaned PostgreSQL public schema.")
        except Exception as ex:
            print(f"Notice during schema reset: {ex}")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Admin & Staff Users
        admin_user = User(
            username="admin",
            email="admin@studycenter.com",
            hashed_password=hash_password("Admin@123"),
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)

        staff_user = User(
            username="staff1",
            email="staff@studycenter.com",
            hashed_password=hash_password("Staff@123"),
            role="LIBRARY_STAFF",
            is_active=True
        )
        db.add(staff_user)
        db.flush()

        # 2. Create Fee Structures / Plans
        plan_a = FeeStructure(
            name="Plan A - 8 Hours Shift",
            description="Standard study desk with high-speed WiFi, RO water, and charging point",
            one_time_fee=500.0,
            monthly_fee=800.0,
            custom_charges=0.0,
            discount=0.0,
            late_fee=50.0,
            validity_months=12,
            is_active=True
        )
        db.add(plan_a)

        plan_b = FeeStructure(
            name="Plan B - 12 Hours Dedicated",
            description="Reserved personal desk with personal locker, comfortable chair, and power socket",
            one_time_fee=1000.0,
            monthly_fee=1200.0,
            custom_charges=0.0,
            discount=50.0,
            late_fee=50.0,
            validity_months=12,
            is_active=True
        )
        db.add(plan_b)

        plan_c = FeeStructure(
            name="Plan C - 24/7 Unlimited VIP",
            description="Quiet premium cabin with ergonomic chair, AC, discussion room, locker & tea access",
            one_time_fee=1500.0,
            monthly_fee=1800.0,
            custom_charges=0.0,
            discount=100.0,
            late_fee=100.0,
            validity_months=12,
            is_active=True
        )
        db.add(plan_c)
        db.flush()

        # 3. Seed Comprehensive Enrolled Students (Monthly, Quarterly, Yearly)
        sample_students = [
            {
                "first_name": "Rahul", "last_name": "Sharma", "mobile": "9876543210",
                "email": "rahul.sharma@example.com", "course": "UPSC Civil Services",
                "college": "Delhi University", "seat_number": "A-12", "timing": "Full Day (8 AM - 8 PM)",
                "plan": plan_a, "custom_monthly_fee": None, "discount": 0.0, 
                "billing_cycle": "MONTHLY", "paid_months_count": 4  # Past 2 + Current + Next Month
            },
            {
                "first_name": "Ananya", "last_name": "Verma", "mobile": "9876543211",
                "email": "ananya.v@example.com", "course": "NEET PG Preparation",
                "college": "AIIMS New Delhi", "seat_number": "B-05", "timing": "Morning Shift (8 AM - 2 PM)",
                "plan": plan_b, "custom_monthly_fee": 1100.0, "discount": 100.0,
                "billing_cycle": "YEARLY", "paid_months_count": 12  # Full Annual Year Paid in Advance!
            },
            {
                "first_name": "Vikram", "last_name": "Singh", "mobile": "9876543212",
                "email": "vikram.s@example.com", "course": "CA Final",
                "college": "ICAI", "seat_number": "C-01", "timing": "24/7 Unlimited Access",
                "plan": plan_c, "custom_monthly_fee": None, "discount": 0.0,
                "billing_cycle": "MONTHLY", "paid_months_count": 2  # Past 2 paid, current & overdue unpaid
            },
            {
                "first_name": "Neha", "last_name": "Patel", "mobile": "9876543213",
                "email": "neha.patel@example.com", "course": "GATE Computer Science",
                "college": "IIT Delhi", "seat_number": "A-15", "timing": "Evening Shift (2 PM - 10 PM)",
                "plan": plan_a, "custom_monthly_fee": 750.0, "discount": 50.0,
                "billing_cycle": "YEARLY", "paid_months_count": 12  # Full Year Paid
            },
            {
                "first_name": "Amit", "last_name": "Kumar", "mobile": "9876543214",
                "email": "amit.k@example.com", "course": "JEE Advanced",
                "college": "DPS RK Puram", "seat_number": "B-10", "timing": "Morning Shift (8 AM - 2 PM)",
                "plan": plan_b, "custom_monthly_fee": None, "discount": 0.0,
                "billing_cycle": "QUARTERLY", "paid_months_count": 5  # Quarter Paid in Advance
            },
            {
                "first_name": "Pooja", "last_name": "Reddy", "mobile": "9876543215",
                "email": "pooja.r@example.com", "course": "SSC CGL",
                "college": "Jamia Millia Islamia", "seat_number": "A-08", "timing": "Full Day (8 AM - 8 PM)",
                "plan": plan_a, "custom_monthly_fee": None, "discount": 0.0,
                "billing_cycle": "MONTHLY", "paid_months_count": 1  # 2 months overdue
            }
        ]

        today = date.today()
        current_year = today.year
        current_month = today.month

        receipt_counter = 1

        for idx, s_data in enumerate(sample_students, 1):
            stu_code = f"STU-{current_year}-{idx:05d}"
            u_name = stu_code.lower()
            
            u = User(
                username=u_name,
                email=s_data["email"],
                hashed_password=hash_password("Student@123"),
                role="STUDENT",
                is_active=True
            )
            db.add(u)
            db.flush()

            joining_dt = today - timedelta(days=60)
            eff_rate = (s_data["custom_monthly_fee"] if s_data["custom_monthly_fee"] is not None else s_data["plan"].monthly_fee) - s_data["discount"]
            eff_rate = max(0.0, eff_rate)

            # Calculate paid_until_date and next_due_date
            paid_count = s_data["paid_months_count"]
            start_m_idx = (current_month - 1) - 2 # Starts 2 months ago
            
            end_paid_idx = start_m_idx + paid_count - 1
            paid_until_y = current_year + (end_paid_idx // 12)
            paid_until_m = (end_paid_idx % 12) + 1
            paid_until = date(paid_until_y, paid_until_m, 28)

            next_due_idx = end_paid_idx + 1
            next_due_y = current_year + (next_due_idx // 12)
            next_due_m = (next_due_idx % 12) + 1
            next_due = date(next_due_y, next_due_m, 5)

            student = Student(
                student_id=stu_code,
                user_id=u.id,
                first_name=s_data["first_name"],
                last_name=s_data["last_name"],
                dob=date(2002, 5, 15),
                gender="Male" if idx % 2 != 0 else "Female",
                mobile=s_data["mobile"],
                email=s_data["email"],
                address="Street 4, Karol Bagh",
                city="New Delhi",
                state="Delhi",
                pincode="110005",
                guardian_name=f"{s_data['last_name']} Guardian",
                guardian_mobile="9998887770",
                guardian_relation="Parent",
                course=s_data["course"],
                college=s_data["college"],
                qualification="Graduate",
                academic_year="2025-2026",
                emergency_contact_name="Emergency Care",
                emergency_contact_number="9998887771",
                emergency_relation="Family",
                enrollment_date=joining_dt,
                joining_date=joining_dt,
                seat_number=s_data["seat_number"],
                preferred_timing=s_data["timing"],
                status="ACTIVE",
                fee_structure_id=s_data["plan"].id,
                custom_monthly_fee=s_data["custom_monthly_fee"],
                fee_discount=s_data["discount"],
                billing_cycle=s_data["billing_cycle"],
                fee_due_day=5,
                paid_until_date=paid_until,
                next_due_date=next_due
            )
            db.add(student)
            db.flush()

            # Generate 14 Months Fee Schedule (-2 to +11)
            paid_items_to_group = []

            for offset in range(-2, 12):
                m_idx = (current_month - 1) + offset
                m_val = (m_idx % 12) + 1
                y_val = current_year + (m_idx // 12)
                due_dt = date(y_val, m_val, 5)

                is_paid = (offset - (-2)) < paid_count

                if is_paid:
                    status_val = "PAID"
                    paid_amt = eff_rate
                    pend_amt = 0.0
                    paid_dt = due_dt - timedelta(days=2)
                else:
                    if due_dt < today:
                        status_val = "OVERDUE"
                    else:
                        status_val = "PENDING"
                    paid_amt = 0.0
                    pend_amt = eff_rate
                    paid_dt = None

                fm = FeeMonth(
                    student_id=student.id,
                    year=y_val,
                    month=m_val,
                    due_amount=eff_rate,
                    paid_amount=paid_amt,
                    pending_amount=pend_amt,
                    discount_amount=s_data["discount"],
                    status=status_val,
                    due_date=due_dt,
                    paid_date=paid_dt
                )
                db.add(fm)
                db.flush()

                if is_paid:
                    paid_items_to_group.append(fm)

            # Generate realistic Payment records
            if paid_items_to_group:
                # If Yearly, generate one annual transaction; otherwise monthly transactions
                if s_data["billing_cycle"] == "YEARLY" and len(paid_items_to_group) >= 12:
                    rcpt_no = f"REC-{current_year}-{receipt_counter:06d}"
                    receipt_counter += 1

                    total_annual = eff_rate * 12
                    pay = Payment(
                        student_id=student.id,
                        receipt_number=rcpt_no,
                        payment_date=datetime(current_year, current_month, 2, 10, 30),
                        total_amount=total_annual,
                        discount_applied=s_data["discount"] * 12,
                        payment_type="YEARLY",
                        payment_mode="UPI" if idx % 2 == 0 else "BANK_TRANSFER",
                        collected_by_user_id=admin_user.id,
                        notes=f"Annual 1-Year Study Center Fee ({s_data['plan'].name})",
                        status="PAID"
                    )
                    db.add(pay)
                    db.flush()

                    for fm in paid_items_to_group[:12]:
                        p_item = PaymentItem(
                            payment_id=pay.id,
                            fee_month_id=fm.id,
                            description=f"Annual Fee - {MONTH_NAMES[fm.month]} {fm.year}",
                            amount=eff_rate
                        )
                        db.add(p_item)

                    rcpt = Receipt(
                        payment_id=pay.id,
                        receipt_number=rcpt_no,
                        issued_at=datetime(current_year, current_month, 2, 10, 30)
                    )
                    db.add(rcpt)
                else:
                    for fm in paid_items_to_group:
                        rcpt_no = f"REC-{current_year}-{receipt_counter:06d}"
                        receipt_counter += 1

                        pay = Payment(
                            student_id=student.id,
                            receipt_number=rcpt_no,
                            payment_date=datetime(fm.year, fm.month, 3, 11, 30),
                            total_amount=eff_rate,
                            discount_applied=s_data["discount"],
                            payment_type="MONTHLY",
                            payment_mode="UPI" if idx % 2 == 0 else "CASH",
                            collected_by_user_id=admin_user.id,
                            notes=f"Monthly fee for {MONTH_NAMES[fm.month]} {fm.year}",
                            status="PAID"
                        )
                        db.add(pay)
                        db.flush()

                        p_item = PaymentItem(
                            payment_id=pay.id,
                            fee_month_id=fm.id,
                            description=f"Monthly Fee ({MONTH_NAMES[fm.month]} {fm.year})",
                            amount=eff_rate
                        )
                        db.add(p_item)

                        rcpt = Receipt(
                            payment_id=pay.id,
                            receipt_number=rcpt_no,
                            issued_at=datetime(fm.year, fm.month, 3, 11, 30)
                        )
                        db.add(rcpt)

            # Attendance Sessions for today
            att_day = AttendanceDay(
                student_id=student.id,
                date=today,
                total_seconds=10800 if idx <= 2 else 0,
                session_count=2 if idx <= 2 else 0
            )
            db.add(att_day)
            db.flush()

            if idx == 1:
                s1 = AttendanceSession(
                    student_id=student.id,
                    attendance_day_id=att_day.id,
                    check_in_time=datetime.utcnow() - timedelta(hours=4),
                    check_out_time=datetime.utcnow() - timedelta(hours=1),
                    duration_seconds=10800,
                    checked_in_by_user_id=staff_user.id,
                    checked_out_by_user_id=staff_user.id,
                    source="DESK",
                    status="COMPLETED",
                    notes="Morning study session"
                )
                db.add(s1)

                s2 = AttendanceSession(
                    student_id=student.id,
                    attendance_day_id=att_day.id,
                    check_in_time=datetime.utcnow() - timedelta(minutes=40),
                    check_out_time=None,
                    duration_seconds=0,
                    checked_in_by_user_id=staff_user.id,
                    source="DESK",
                    status="ACTIVE",
                    notes="Afternoon study session"
                )
                db.add(s2)
            elif idx == 2:
                s_act = AttendanceSession(
                    student_id=student.id,
                    attendance_day_id=att_day.id,
                    check_in_time=datetime.utcnow() - timedelta(hours=2),
                    check_out_time=None,
                    duration_seconds=0,
                    checked_in_by_user_id=staff_user.id,
                    source="QR_CODE",
                    status="ACTIVE",
                    notes="NEET Preparation session"
                )
                db.add(s_act)

        db.commit()
        print("Database seed successfully executed with cycle-aware fee mappings and enriched receipts!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
