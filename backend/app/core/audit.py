import json
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit(
    db: Session,
    user_id: Optional[int],
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            old_value=json.dumps(old_value, default=str) if old_value else None,
            new_value=json.dumps(new_value, default=str) if new_value else None,
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.flush()
    except Exception as e:
        # Prevent failure in audit logging from breaking main flow, but print/log error
        print(f"Failed to record audit log: {e}")
