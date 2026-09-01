from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_roles
from app.models.user import User
from app.schemas.report import AdminDashboardStats
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "LIBRARY_STAFF"]))
):
    return report_service.get_admin_dashboard_stats(db)
