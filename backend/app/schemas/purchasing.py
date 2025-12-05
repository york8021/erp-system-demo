from datetime import datetime
from enum import Enum
from typing import List

from pydantic import BaseModel


# 狀態列舉和 models 對應
class POStatus(str, Enum):
    draft = "draft"
    approved = "approved"
    closed = "closed"


class GRStatus(str, Enum):
    draft = "draft"
    posted = "posted"


# ---------- Purchase Order ----------

class PurchaseOrderLineIn(BaseModel):
    item_id: int
    warehouse_id: int
    qty: int
    unit_price: float


class PurchaseOrderCreate(BaseModel):
    vendor_id: int
    order_date: datetime | None = None
    lines: List[PurchaseOrderLineIn]


class PurchaseOrderLineOut(PurchaseOrderLineIn):
    id: int

    class Config:
        from_attributes = True


class PurchaseOrderOut(BaseModel):
    id: int
    po_number: str
    vendor_id: int
    status: POStatus
    order_date: datetime
    lines: List[PurchaseOrderLineOut]

    class Config:
        from_attributes = True


# ---------- Goods Receipt ----------

class GoodsReceiptLineIn(BaseModel):
    item_id: int
    warehouse_id: int
    qty: int
    unit_cost: float


class GoodsReceiptCreate(BaseModel):
    po_id: int | None = None
    receipt_date: datetime | None = None
    lines: List[GoodsReceiptLineIn]


class GoodsReceiptLineOut(GoodsReceiptLineIn):
    id: int

    class Config:
        from_attributes = True


class GoodsReceiptOut(BaseModel):
    id: int
    gr_number: str
    po_id: int | None
    status: GRStatus
    receipt_date: datetime
    lines: List[GoodsReceiptLineOut]

    class Config:
        from_attributes = True
