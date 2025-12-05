from pydantic import BaseModel
from datetime import datetime


# ───────────────────────────
# Transaction Schemas
# ───────────────────────────
class InventoryTransactionBase(BaseModel):
    item_id: int
    warehouse_id: int
    qty: float
    ref_type: str | None = None
    ref_id: int | None = None


class InventoryTransactionCreate(InventoryTransactionBase):
    pass


class InventoryTransactionOut(InventoryTransactionBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


# ───────────────────────────
# Balance Schemas
# ───────────────────────────
class InventoryBalanceBase(BaseModel):
    item_id: int
    warehouse_id: int
    qty_on_hand: float


class InventoryBalanceOut(InventoryBalanceBase):
    id: int

    class Config:
        from_attributes = True
