from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import UserRole
from app.models.master import (
    Item, Customer, Vendor, Warehouse
)
from app.schemas.master import (
    ItemCreate, ItemUpdate, ItemOut,
    CustomerCreate, CustomerUpdate, CustomerOut,
    VendorCreate, VendorUpdate, VendorOut,
    WarehouseCreate, WarehouseUpdate, WarehouseOut,
)
from app.core.logger import write_log

router = APIRouter(prefix="/master", tags=["master"])
ALLOWED = [UserRole.admin, UserRole.manager]


# ───────────────────────────
# Item CRUD
# ───────────────────────────
@router.get("/items", response_model=list[ItemOut])
def list_items(db: Session = Depends(get_db), _=Depends(require_roles(ALLOWED))):
    return db.query(Item).all()


@router.post("/items", response_model=ItemOut)
def create_item(
    data: ItemCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if db.query(Item).filter(Item.code == data.code).first():
        raise HTTPException(400, "Item code exists")

    item = Item(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)

    write_log(db, user.email, "Create Item", "master", item.id, f"{data.dict()}")
    return item


@router.patch("/items/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    data: ItemUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    before = item.__dict__.copy()

    if data.name is not None:
        item.name = data.name
    if data.unit is not None:
        item.unit = data.unit

    db.commit()
    db.refresh(item)

    write_log(db, user.email, "Update Item", "master", item.id, f"Before={before}, After={item.__dict__}")
    return item


# ───────────────────────────
# Customer CRUD
# ───────────────────────────
@router.get("/customers", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db), _=Depends(require_roles(ALLOWED))):
    return db.query(Customer).all()


@router.post("/customers", response_model=CustomerOut)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    customer = Customer(**data.dict())
    db.add(customer)
    db.commit()
    db.refresh(customer)

    write_log(db, user.email, "Create Customer", "master", customer.id, f"{data.dict()}")
    return customer


@router.patch("/customers/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Customer not found")

    before = customer.__dict__.copy()

    if data.name is not None:
        customer.name = data.name
    if data.contact is not None:
        customer.contact = data.contact

    db.commit()
    db.refresh(customer)

    write_log(db, user.email, "Update Customer", "master", customer.id, f"Before={before}, After={customer.__dict__}")
    return customer



# ───────────────────────────
# Vendor CRUD
# ───────────────────────────
@router.get("/vendors", response_model=list[VendorOut])
def list_vendors(db: Session = Depends(get_db), _=Depends(require_roles(ALLOWED))):
    return db.query(Vendor).all()


@router.post("/vendors", response_model=VendorOut)
def create_vendor(
    data: VendorCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    vendor = Vendor(**data.dict())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)

    write_log(
        db=db,
        user_email=user.email,
        action="Create Vendor",
        module="master",
        ref_id=vendor.id,
        details=f"{data.dict()}"
    )

    return vendor


@router.patch("/vendors/{vendor_id}", response_model=VendorOut)
def update_vendor(
    vendor_id: int,
    data: VendorUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(404, "Vendor not found")

    before = vendor.__dict__.copy()

    if data.name is not None:
        vendor.name = data.name
    if data.contact is not None:
        vendor.contact = data.contact

    db.commit()
    db.refresh(vendor)

    write_log(
        db=db,
        user_email=user.email,
        action="Update Vendor",
        module="master",
        ref_id=vendor.id,
        details=f"Before={before}, After={vendor.__dict__}"
    )

    return vendor



# ───────────────────────────
# Warehouse CRUD
# ───────────────────────────
@router.get("/warehouses", response_model=list[WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db),
    _=Depends(require_roles(ALLOWED))
):
    return db.query(Warehouse).all()


@router.post("/warehouses", response_model=WarehouseOut)
def create_warehouse(
    data: WarehouseCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if db.query(Warehouse).filter(Warehouse.code == data.code).first():
        raise HTTPException(400, "Warehouse code exists")

    wh = Warehouse(**data.dict())
    db.add(wh)
    db.commit()
    db.refresh(wh)

    write_log(
        db=db,
        user_email=user.email,
        action="Create Warehouse",
        module="master",
        ref_id=wh.id,
        details=f"{data.dict()}"
    )

    return wh


@router.patch("/warehouses/{warehouse_id}", response_model=WarehouseOut)
def update_warehouse(
    warehouse_id: int,
    data: WarehouseUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(404, "Warehouse not found")

    before = wh.__dict__.copy()

    if data.name is not None:
        wh.name = data.name

    db.commit()
    db.refresh(wh)

    write_log(
        db=db,
        user_email=user.email,
        action="Update Warehouse",
       module="master",
        ref_id=wh.id,
        details=f"Before={before}, After={wh.__dict__}"
    )

    return wh
