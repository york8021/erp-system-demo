from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from .config import get_settings

from enum import Enum
from typing import Iterable
from fastapi import Depends, HTTPException, status
from app.api.deps import get_current_user  # 你實際的路徑可能是 app.api.deps

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"
    PURCHASING = "purchasing"

def require_roles(allowed_roles: Iterable[UserRole]):
    """
    回傳一個 FastAPI 的 dependency，用來檢查目前登入者的角色是否在 allowed_roles 中。
    用法：
      current_user = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
    """
    def _dependency(current_user = Depends(get_current_user)):
        if current_user.role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return _dependency

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "role": role, "exp": expire}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None
