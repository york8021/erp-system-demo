from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.core.security import verify_password, create_access_token
from app.core.logger import write_log

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    password = payload.get("password")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password")

    token = create_access_token(subject=user.email, role=user.role.value)

    # Log login
    write_log(
        db=db,
        user_email=user.email,
        action="Login",
        module="auth",
        ref_id=None,
        details="User logged in"
    )

    return {
        "access_token": token,
        "user": UserOut.from_orm(user)
    }
