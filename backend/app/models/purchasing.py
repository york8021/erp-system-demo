from sqlalchemy import Integer, ForeignKey, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.models.base import Base
from app.models.master import Vendor, Item, Warehouse


# ───────────────────────────
# Purchase Order 主表
# ───────────────────────────
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(50), default="open")  # open / closed

    vendor: Mapped[Vendor] = relationship()
    lines: Mapped[list["PurchaseOrderLine"]] = relationship(back_populates="po")


# ───────────────────────────
# Purchase Order 明細
# ───────────────────────────
class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    po_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)

    item: Mapped[Item] = relationship()
    po: Mapped[PurchaseOrder] = relationship(back_populates="lines")


# ───────────────────────────
# Goods Receipt（收貨單）
# ───────────────────────────
class GoodsReceipt(Base):
    __tablename__ = "goods_receipts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    po_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    warehouse: Mapped[Warehouse] = relationship()
    po: Mapped[PurchaseOrder] = relationship()
    lines: Mapped[list["GoodsReceiptLine"]] = relationship(back_populates="gr")


# ───────────────────────────
# Goods Receipt 明細
# ───────────────────────────
class GoodsReceiptLine(Base):
    __tablename__ = "goods_receipt_lines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    gr_id: Mapped[int] = mapped_column(ForeignKey("goods_receipts.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)

    item: Mapped[Item] = relationship()
    gr: Mapped[GoodsReceipt] = relationship(back_populates="lines")
