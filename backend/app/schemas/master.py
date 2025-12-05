from pydantic import BaseModel


# ───────────────────────────
# Item Schemas
# ───────────────────────────
class ItemBase(BaseModel):
    code: str
    name: str
    unit: str = "pcs"


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    unit: str | None = None


class ItemOut(ItemBase):
    id: int

    class Config:
        from_attributes = True


# ───────────────────────────
# Customer Schemas
# ───────────────────────────
class CustomerBase(BaseModel):
    name: str
    contact: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    contact: str | None = None


class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ───────────────────────────
# Vendor Schemas
# ───────────────────────────
class VendorBase(BaseModel):
    name: str
    contact: str | None = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: str | None = None
    contact: str | None = None


class VendorOut(VendorBase):
    id: int

    class Config:
        from_attributes = True


# ───────────────────────────
# Warehouse Schemas
# ───────────────────────────
class WarehouseBase(BaseModel):
    code: str
    name: str


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: str | None = None


class WarehouseOut(WarehouseBase):
    id: int

    class Config:
        from_attributes = True
