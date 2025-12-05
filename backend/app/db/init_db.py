from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def init_admin():
    db: Session = SessionLocal()

    admin_email = "admin@example.com"

    exists = db.query(User).filter(User.email == admin_email).first()
    if exists:
        db.close()
        return

    admin = User(
        email=admin_email,
        full_name="Administrator",
        role=UserRole.admin,
        hashed_password=get_password_hash("admin123"),
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.close()

    print("[init_db] Created admin: admin@example.com / admin123")
