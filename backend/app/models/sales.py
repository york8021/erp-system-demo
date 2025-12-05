from datetime import datetime
from sqlalchemy import String, ForeignKey, Integer, DateTime, Enum, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base


class SOStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    closed = "closed"


class ShipmentStatus(str, enum.Enum):
    draft = "draft"
    posted = "posted"


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    so_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    status: Mapped[SOStatus] = mapped_column(Enum(SOStatus), default=SOStatus.draft)
    order_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lines: Mapped[list["SalesOrderLine"]] = relationship(
        back_populates="so",
        cascade="all, delete-orphan",
    )


class SalesOrderLine(Base):
    __tablename__ = "sales_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    so_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id", ondelete="CASCADE"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"))
    qty: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2))

    so: Mapped[SalesOrder] = relationship(back_populates="lines")


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(primary_key=True)
    shipment_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    so_id: Mapped[int | None] = mapped_column(ForeignKey("sales_orders.id"), nullable=True)
    status: Mapped[ShipmentStatus] = mapped_column(Enum(ShipmentStatus), default=ShipmentStatus.draft)
    ship_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lines: Mapped[list["ShipmentLine"]] = relationship(
        back_populates="shipment",
        cascade="all, delete-orphan",
    )


class ShipmentLine(Base):
    __tablename__ = "shipment_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    shipment_id: Mapped[int] = mapped_column(ForeignKey("shipments.id", ondelete="CASCADE"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"))
    qty: Mapped[int] = mapped_column(Integer)
    unit_cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    shipment: Mapped[Shipment] = relationship(back_populates="lines")
