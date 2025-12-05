from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_roles
from app.models import Item, Customer, Vendor, Warehouse
from app.models.user import User, UserRole
from app.schemas.master import (
    ItemCreate,
    ItemUpdate,
    ItemOut,
    CustomerCreate,
    CustomerUpdate,
    CustomerOut,
    VendorCreate,
    VendorUpdate,
    VendorOut,
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseOut,
)

router = APIRouter()

ALLOWED_MASTER_ROLES = [
    UserRole.admin,
    UserRole.manager,
]


# ===== Items =====

@router.get("/items", response_model=list[ItemOut])
def list_items(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_MASTER_ROLES)),
):
    return db.query(Item).all()


@router.post("/items", response_model=ItemOut)
def create_item(
    data: ItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_MASTER_ROLES)),
):
    if db.query(Item).filter(Item.sku == data.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    item = Item(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    data: ItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_MASTER_ROLES)),
):
    item = db.query(Item).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_MASTER_ROLES)),
):
    item = db.query(Item).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"ok": True}


# ===== Customers / Vendors / Warehouses 可以用同樣 pattern 實作
# 你之後可以照上面的 Items 寫 CRUD（或如果你要，我下一步可以直接幫你補完）
