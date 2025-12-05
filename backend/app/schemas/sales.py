from pydantic import BaseModel
from datetime import datetime


# ───────────────────────────
# Sales Order Schemas
# ───────────────────────────
class SOLineBase(BaseModel):
    item_id: int
    qty: float


class SOLineCreate(SOLineBase):
    pass


class SOLineOut(SOLineBase):
    id: int

    class Config:
        from_attributes = True


class SOBase(BaseModel):
    customer_id: int


class SOCreate(SOBase):
    lines: list[SOLineCreate]


class SOOut(SOBase):
    id: int
    date: datetime
    status: str
    lines: list[SOLineOut]

    class Config:
        from_attributes = True


# ───────────────────────────
# Shipment Schemas
# ───────────────────────────
class ShipmentLineBase(BaseModel):
    item_id: int
    qty: float


class ShipmentLineCreate(ShipmentLineBase):
    pass


class ShipmentLineOut(ShipmentLineBase):
    id: int

    class Config:
        from_attributes = True


class ShipmentCreate(BaseModel):
    so_id: int
    warehouse_id: int
    lines: list[ShipmentLineCreate]


class ShipmentOut(BaseModel):
    id: int
    so_id: int
    warehouse_id: int
    date: datetime
    lines: list[ShipmentLineOut]

    class Config:
        from_attributes = True
