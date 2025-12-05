from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.core.security import get_password_hash
from app.api.deps import require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user=Depends(require_admin)):
    return db.query(User).all()


@router.post("/", response_model=UserOut)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    user=Depends(require_admin)
):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already exists")

    new_user = User(
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        hashed_password=get_password_hash(data.password),
        is_active=data.is_active,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password:
        user.hashed_password = get_password_hash(data.password)

    db.commit()
    db.refresh(user)
    return user
