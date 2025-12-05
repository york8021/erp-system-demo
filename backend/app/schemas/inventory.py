from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class InventoryTxnType(str, Enum):
    RECEIPT = "RECEIPT"
    ISSUE = "ISSUE"
    ADJUST = "ADJUST"


class InventoryTransactionOut(BaseModel):
    id: int
    txn_type: InventoryTxnType
    item_id: int
    warehouse_id: int
    qty: int
    unit_cost: float
    ref_type: str | None
    ref_id: int | None
    txn_time: datetime

    class Config:
        from_attributes = True


class InventoryBalanceOut(BaseModel):
    id: int
    item_id: int
    warehouse_id: int
    qty: int
    avg_cost: float

    class Config:
        from_attributes = True
