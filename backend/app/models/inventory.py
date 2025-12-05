from datetime import datetime
from sqlalchemy import String, ForeignKey, Integer, DateTime, Enum, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.db.base import Base


class InventoryTxnType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    ISSUE = "ISSUE"
    ADJUST = "ADJUST"


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    txn_type: Mapped[InventoryTxnType] = mapped_column(Enum(InventoryTxnType))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"))
    qty: Mapped[int] = mapped_column(Integer)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 4))
    ref_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    txn_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InventoryBalance(Base):
    __tablename__ = "inventory_balances"
    __table_args__ = (
        UniqueConstraint("item_id", "warehouse_id", name="uq_item_wh"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"))
    qty: Mapped[int] = mapped_column(Integer, default=0)
    avg_cost: Mapped[float] = mapped_column(Numeric(12, 4), default=0)
