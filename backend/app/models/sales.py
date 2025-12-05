from sqlalchemy import Integer, ForeignKey, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.models.base import Base
from app.models.master import Customer, Item, Warehouse


# ───────────────────────────
# Sales Order 主表
# ───────────────────────────
class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(50), default="open")  # open / shipped

    customer: Mapped[Customer] = relationship()
    lines: Mapped[list["SalesOrderLine"]] = relationship(back_populates="so")


# ───────────────────────────
# Sales Order 明細
# ───────────────────────────
class SalesOrderLine(Base):
    __tablename__ = "sales_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    so_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)

    item: Mapped[Item] = relationship()
    so: Mapped[SalesOrder] = relationship(back_populates="lines")


# ───────────────────────────
# Shipment 出貨主檔
# ───────────────────────────
class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    so_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    warehouse: Mapped[Warehouse] = relationship()
    so: Mapped[SalesOrder] = relationship()
    lines: Mapped[list["ShipmentLine"]] = relationship(back_populates="shipment")


# ───────────────────────────
# Shipment 出貨明細
# ───────────────────────────
class ShipmentLine(Base):
    __tablename__ = "shipment_lines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    shipment_id: Mapped[int] = mapped_column(ForeignKey("shipments.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)

    item: Mapped[Item] = relationship()
    shipment: Mapped[Shipment] = relationship(back_populates="lines")
