from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.core.security import get_password_hash
from app.api.deps import require_admin, get_current_user
from app.core.logger import write_log

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).all()


@router.post("/", response_model=UserOut)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)  # 拿到操作人 email
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

    write_log(
        db=db,
        user_email=user.email,
        action="Create User",
        module="user",
        ref_id=new_user.id,
        details=f"New user: {new_user.email}, role={new_user.role}"
    )

    return new_user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")

    before = target.__dict__.copy()

    # Update fields
    if data.full_name is not None:
        target.full_name = data.full_name
    if data.role is not None:
        target.role = data.role
    if data.is_active is not None:
        target.is_active = data.is_active
    if data.password:
        target.hashed_password = get_password_hash(data.password)

    db.commit()
    db.refresh(target)

    write_log(
        db=db,
        user_email=user.email,
        action="Update User",
        module="user",
        ref_id=target.id,
        details=f"Before={before}, After={target.__dict__}"
    )

    return target
