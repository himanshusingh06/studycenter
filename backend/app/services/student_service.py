from datetime import datetime, date, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.models.student import Student
from app.models.user import User
from app.models.fee import FeeStructure, FeeMonth
from app.core.security import hash_password
from app.schemas.student import StudentCreate, StudentUpdate

def generate_next_student_id(db: Session) -> str:
    current_year = datetime.now().year
    prefix = f"STU-{current_year}-"
    latest_student = (
        db.query(Student)
        .filter(Student.student_id.like(f"{prefix}%"))
        .order_by(Student.id.desc())
        .first()
    )
    if latest_student:
        try:
            num_part = int(latest_student.student_id.split("-")[-1])
            next_num = num_part + 1
        except ValueError:
            next_num = 1
    else:
        next_num = 1
    return f"{prefix}{next_num:05d}"

def create_student_with_account(db: Session, data: StudentCreate) -> Student:
    # 1. Generate unique student_id
    new_student_id = generate_next_student_id(db)

    # 2. Automatically create associated User account for student login
    username = new_student_id.lower()
    email_val = data.email if data.email else f"{username}@studycenter.local"
    
    existing_user = db.query(User).filter(or_(User.username == username, User.email == email_val)).first()
    if existing_user:
        username = f"{username}_{int(datetime.utcnow().timestamp())}"
        email_val = f"{username}@studycenter.local"

    default_password = data.mobile if data.mobile else "Student@123"
    user = User(
        username=username,
        email=email_val,
        hashed_password=hash_password(default_password),
        role="STUDENT",
        is_active=True
    )
    db.add(user)
    db.flush()

    # 3. Create Student record
    joining_dt = data.joining_date or date.today()
    enrollment_dt = data.enrollment_date or joining_dt
    due_day = data.fee_due_day or 5
    
    # Calculate initial next_due_date
    next_due = date(joining_dt.year, joining_dt.month, min(due_day, 28))
    
    student_dict = data.model_dump(exclude={"joining_date", "enrollment_date", "fee_due_day"})
    
    student = Student(
        **student_dict,
        student_id=new_student_id,
        user_id=user.id,
        status="ACTIVE",
        joining_date=joining_dt,
        enrollment_date=enrollment_dt,
        fee_due_day=due_day,
        next_due_date=next_due,
        paid_until_date=None
    )
    db.add(student)
    db.flush()

    # 4. Generate Initial Fee Schedule (Current Month + Next 11 Months)
    if data.fee_structure_id:
        fee_struct = db.query(FeeStructure).filter(FeeStructure.id == data.fee_structure_id).first()
        if fee_struct:
            monthly_rate = data.custom_monthly_fee if data.custom_monthly_fee is not None else fee_struct.monthly_fee
            discount = data.fee_discount or 0.0
            effective_rate = max(0.0, monthly_rate - discount)

            cur_year = joining_dt.year
            cur_month = joining_dt.month
            for m in range(12):
                m_val = ((cur_month - 1 + m) % 12) + 1
                y_val = cur_year + ((cur_month - 1 + m) // 12)
                due_dt = date(y_val, m_val, min(due_day, 28))
                
                fee_month = FeeMonth(
                    student_id=student.id,
                    year=y_val,
                    month=m_val,
                    due_amount=effective_rate,
                    paid_amount=0.0,
                    pending_amount=effective_rate,
                    discount_amount=discount,
                    status="PENDING",
                    due_date=due_dt
                )
                db.add(fee_month)

    db.commit()
    db.refresh(student)
    return student

def search_students(
    db: Session,
    query_str: Optional[str] = None,
    status: Optional[str] = None,
    fee_structure_id: Optional[int] = None,
    gender: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Student], int]:
    q = db.query(Student)

    if query_str:
        search_pattern = f"%{query_str}%"
        q = q.filter(
            or_(
                Student.student_id.ilike(search_pattern),
                Student.first_name.ilike(search_pattern),
                Student.last_name.ilike(search_pattern),
                Student.mobile.ilike(search_pattern),
                Student.email.ilike(search_pattern),
                Student.seat_number.ilike(search_pattern),
                Student.guardian_mobile.ilike(search_pattern)
            )
        )

    if status:
        q = q.filter(Student.status == status)

    if fee_structure_id:
        q = q.filter(Student.fee_structure_id == fee_structure_id)

    if gender:
        q = q.filter(Student.gender == gender)

    total = q.count()
    students = q.order_by(desc(Student.id)).offset((page - 1) * page_size).limit(page_size).all()
    return students, total
