from sqlalchemy.orm import Session
from app.models.log import AuditLog


def write_log(
    db: Session,
    user_email: str | None,
    action: str,
    module: str,
    ref_id: int | None = None,
    details: str | None = None,
):
    log = AuditLog(
        user_email=user_email,
        action=action,
        module=module,
        ref_id=ref_id,
        details=details
    )
    db.add(log)
    db.commit()
