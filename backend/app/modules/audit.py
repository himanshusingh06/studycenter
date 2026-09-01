from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_roles
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(["ADMIN"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(100).all()
    res = []
    for l in logs:
        r = AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            username=l.user.username if l.user else "System",
            action=l.action,
            entity=l.entity,
            entity_id=l.entity_id,
            old_value=l.old_value,
            new_value=l.new_value,
            ip_address=l.ip_address,
            timestamp=l.timestamp
        )
        res.append(r)
    return res
