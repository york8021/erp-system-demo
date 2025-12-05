from sqlalchemy import Integer, ForeignKey, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.models.base import Base
from app.models.master import Item, Warehouse


# ───────────────────────────
# 庫存交易紀錄（增/減庫存）
# ───────────────────────────
class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)  # +入庫, -出庫
    ref_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    item: Mapped[Item] = relationship()
    warehouse: Mapped[Warehouse] = relationship()


# ───────────────────────────
# 庫存餘額（即時庫存）
# ───────────────────────────
class InventoryBalance(Base):
    __tablename__ = "inventory_balances"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    qty_on_hand: Mapped[float] = mapped_column(Float, default=0)

    item: Mapped[Item] = relationship()
    warehouse: Mapped[Warehouse] = relationship()
