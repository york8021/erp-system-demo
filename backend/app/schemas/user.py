from pydantic import BaseModel, EmailStr
from enum import Enum


class UserRole(str, Enum):
    employee = "employee"
    admin = "admin"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.employee
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = None


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True
