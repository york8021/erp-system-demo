from sqlalchemy.orm import Session

from app.models import User, UserRole
from app.core.security import get_password_hash

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin12345"


def init_db(db: Session):
    admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            email=ADMIN_EMAIL,
            full_name="Admin",
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.commit()
