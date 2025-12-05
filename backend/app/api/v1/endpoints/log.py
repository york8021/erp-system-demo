from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_admin
from app.models.log import AuditLog
from app.schemas.log import AuditLogOut

router = APIRouter(prefix="/log", tags=["log"])


@router.get("/", response_model=list[AuditLogOut])
def list_logs(
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
