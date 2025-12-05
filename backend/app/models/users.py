# backend/app/models/user.py
from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.db.base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    sales = "sales"
    purchasing = "purchasing"
    employee = "employee"  # 保留原本角色，有需要可以當一般員工用


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.employee,
        nullable=False,
    )
