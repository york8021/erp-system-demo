from datetime import datetime
from enum import Enum
from typing import List

from pydantic import BaseModel


class SOStatus(str, Enum):
    draft = "draft"
    approved = "approved"
    closed = "closed"


class ShipmentStatus(str, Enum):
    draft = "draft"
    posted = "posted"


# ---------- Sales Order ----------

class SalesOrderLineIn(BaseModel):
    item_id: int
    warehouse_id: int
    qty: int
    unit_price: float


class SalesOrderCreate(BaseModel):
    customer_id: int
    order_date: datetime | None = None
    lines: List[SalesOrderLineIn]


class SalesOrderLineOut(SalesOrderLineIn):
    id: int

    class Config:
        from_attributes = True


class SalesOrderOut(BaseModel):
    id: int
    so_number: str
    customer_id: int
    status: SOStatus
    order_date: datetime
    lines: List[SalesOrderLineOut]

    class Config:
        from_attributes = True


# ---------- Shipment ----------

class ShipmentLineIn(BaseModel):
    item_id: int
    warehouse_id: int
    qty: int
    # 出庫成本，post 的時候會根據 avg_cost 自動填，如果你前端不特別給可以留空
    unit_cost: float | None = None


class ShipmentCreate(BaseModel):
    so_id: int | None = None
    ship_date: datetime | None = None
    lines: List[ShipmentLineIn]


class ShipmentLineOut(ShipmentLineIn):
    id: int

    class Config:
        from_attributes = True


class ShipmentOut(BaseModel):
    id: int
    shipment_number: str
    so_id: int | None
    status: ShipmentStatus
    ship_date: datetime
    lines: List[ShipmentLineOut]

    class Config:
        from_attributes = True
