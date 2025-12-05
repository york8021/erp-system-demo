from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def init_admin():
    """
    若資料庫內尚未有 admin 帳號，則自動建立一個預設管理者。
    """
    db: Session = SessionLocal()

    admin_email = "admin@example.com"
    admin_password = "admin123"

    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        print("[init_db] Admin already exists, skipping init.")
        db.close()
        return

    admin = User(
        email=admin_email,
        full_name="Administrator",
        role=UserRole.admin,
        hashed_password=get_password_hash(admin_password),
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.close()

    print(f"[init_db] Created default admin: {admin_email} / {admin_password}")
