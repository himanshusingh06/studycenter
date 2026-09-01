# Buddha Library Management System (A Unit of Flair Foundation)

A production-ready, full-stack **Buddha Library & Study Center Management System** built with **React**, **Vite**, **Tailwind CSS**, **FastAPI**, **SQLAlchemy**, **PostgreSQL**, **JWT Authentication**, and **Role-Based Access Control (RBAC)**.
*Motto: "बुद्धम शरणम् गच्छामि।"*

---

## Key Features

1. **Role-Based Access Control (RBAC)**:
   - **ADMIN**: Complete system access, user management, financial reports, audit logs, fee structures.
   - **LIBRARY STAFF**: Student enrollment, front desk attendance check-in/out, fee collection, student ID card generation.
   - **STUDENT**: Self-service portal, digital QR ID card pass, personal study hours analytics, payment receipts.

2. **Student Enrollment & Auto ID Generation**:
   - Sequential, unique Student ID format: `STU-2026-00001`.
   - Drag & drop student photo uploader with preview and size/type validation.
   - Comprehensive student details (Personal, Guardian, Academic, Emergency, Seat assignment, Shift timing).

3. **Multi-Session Daily Attendance System**:
   - Session-based model allowing **multiple check-in & check-out sessions per day**.
   - Active session guard constraint: Prevents double check-in while already checked in (`HTTP 400 Bad Request`).
   - Front Desk Reception UI optimized for instant search or contact-less QR scan with live occupancy counter.

4. **Configurable Fee Structures & Financial Ledger**:
   - Flexible plans (Plan A, Plan B, Plan C) supporting one-time enrollment charges, monthly fees, and discounts.
   - Immutable fee history: Editing a fee plan does not alter past payments or receipts.
   - Monthly Fee Matrix Grid (`Student | Plan | Month | Amount | Paid | Pending | Status | Action`).
   - Unique sequential receipt generation: `REC-2026-000123`.

5. **Dashboards & Analytics**:
   - Data-centric Admin Dashboard with 12 KPI metrics and 4 Recharts visual graphs (Monthly Revenue, Enrollments, Daily Attendance, Subscriptions).
   - Printable & downloadable Student ID Cards and Payment Receipts.
   - Full security audit logging for financial and operational actions.

---

## Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python seed.py
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will be live at: `http://localhost:5173`

---

## Demo Credentials (Seeded)

| Role | Username / ID | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Full System & User Management |
| **Library Staff** | `staff1` | `Staff@123` | Front Desk, Enrollment & Fee Collection |
| **Student** | `stu-2026-00001` | `Student@123` | Student Self-Service Portal & Digital ID |

---

## Automated Pytest Suite
```bash
python -m pytest backend/tests
```

---

## Docker Deployment
```bash
docker-compose up --build -d
```
