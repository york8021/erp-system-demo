from pydantic import BaseModel
from datetime import datetime


# ───────────────────────────
# Purchase Order Schemas
# ───────────────────────────
class POLineBase(BaseModel):
    item_id: int
    qty: float


class POLineCreate(POLineBase):
    pass


class POLineOut(POLineBase):
    id: int

    class Config:
        from_attributes = True


class POBase(BaseModel):
    vendor_id: int


class POCreate(POBase):
    lines: list[POLineCreate]


class POOut(POBase):
    id: int
    date: datetime
    status: str
    lines: list[POLineOut]

    class Config:
        from_attributes = True


# ───────────────────────────
# Goods Receipt Schemas
# ───────────────────────────
class GRLineBase(BaseModel):
    item_id: int
    qty: float


class GRLineCreate(GRLineBase):
    pass


class GRLineOut(GRLineBase):
    id: int

    class Config:
        from_attributes = True


class GRCreate(BaseModel):
    po_id: int
    warehouse_id: int
    lines: list[GRLineCreate]


class GROut(BaseModel):
    id: int
    po_id: int
    warehouse_id: int
    date: datetime
    lines: list[GRLineOut]

    class Config:
        from_attributes = True
