from pydantic import BaseModel
from datetime import datetime


class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    user_email: str | None
    action: str
    module: str
    ref_id: int | None
    details: str | None

    class Config:
        from_attributes = True
