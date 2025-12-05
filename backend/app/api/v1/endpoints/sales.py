from datetime import datetime
import time
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models import (
    SalesOrder,
    SalesOrderLine,
    Shipment,
    ShipmentLine,
    SOStatus,
    ShipmentStatus,
    InventoryTransaction,
    InventoryBalance,
    InventoryTxnType,
)
from app.schemas.sales import (
    SalesOrderCreate,
    SalesOrderOut,
    ShipmentCreate,
    ShipmentOut,
)
from app.models.user import User

router = APIRouter()


# ====== 單號產生 ======

def generate_so_number() -> str:
    return f"SO-{int(time.time() * 1000)}"


def generate_shipment_number() -> str:
    return f"SHP-{int(time.time() * 1000)}"


# ====== 庫存扣減（移動平均成本） ======

def apply_issue_to_inventory(
    db: Session,
    *,
    item_id: int,
    warehouse_id: int,
    qty: int,
    ref_type: str,
    ref_id: int,
) -> float:
    """
    依照移動平均成本扣庫存：
    - 使用當前 avg_cost 作為出庫成本
    - 若庫存不足會丟 HTTP 400
    - 回傳這次出庫的 unit_cost（給 ShipmentLine 用）
    """
    if qty <= 0:
        raise ValueError("qty must be positive")

    balance = (
        db.query(InventoryBalance)
        .filter(
            InventoryBalance.item_id == item_id,
            InventoryBalance.warehouse_id == warehouse_id,
        )
        .first()
    )
    if balance is None or (balance.qty or 0) < qty:
        raise HTTPException(status_code=400, detail="Insufficient inventory")

    old_qty = balance.qty
    old_cost = float(balance.avg_cost or 0)
    out_qty = qty

    new_qty = old_qty - out_qty
    # 移動平均法下，出庫不改 avg_cost
    new_avg_cost = old_cost if new_qty > 0 else 0

    balance.qty = new_qty
    balance.avg_cost = new_avg_cost

    txn = InventoryTransaction(
        txn_type=InventoryTxnType.ISSUE,
        item_id=item_id,
        warehouse_id=warehouse_id,
        qty=out_qty,
        unit_cost=old_cost,
        ref_type=ref_type,
        ref_id=ref_id,
        txn_time=datetime.utcnow(),
    )
    db.add(txn)

    return old_cost


# ====== Sales Orders ======

@router.post("/sales-orders", response_model=SalesOrderOut)
def create_so(
    data: SalesOrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    so = SalesOrder(
        so_number=generate_so_number(),
        customer_id=data.customer_id,
        status=SOStatus.draft,
        order_date=data.order_date or datetime.utcnow(),
    )
    db.add(so)
    db.flush()

    for line in data.lines:
        if line.qty <= 0:
            raise HTTPException(status_code=400, detail="Line qty must be positive")
        if line.unit_price < 0:
            raise HTTPException(status_code=400, detail="unit_price cannot be negative")
        so_line = SalesOrderLine(
            so_id=so.id,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            qty=line.qty,
            unit_price=line.unit_price,
        )
        db.add(so_line)

    db.commit()
    db.refresh(so)
    return so


@router.get("/sales-orders", response_model=List[SalesOrderOut])
def list_so(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    customer_id: int | None = Query(None),
    status: SOStatus | None = Query(None),
):
    q = db.query(SalesOrder)
    if customer_id is not None:
        q = q.filter(SalesOrder.customer_id == customer_id)
    if status is not None:
        q = q.filter(SalesOrder.status == status)
    return q.order_by(SalesOrder.order_date.desc()).all()


@router.get("/sales-orders/{so_id}", response_model=SalesOrderOut)
def get_so(
    so_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    so = db.query(SalesOrder).get(so_id)
    if not so:
        raise HTTPException(status_code=404, detail="SO not found")
    return so


@router.post("/sales-orders/{so_id}/approve", response_model=SalesOrderOut)
def approve_so(
    so_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    so = db.query(SalesOrder).get(so_id)
    if not so:
        raise HTTPException(status_code=404, detail="SO not found")
    if so.status != SOStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft SO can be approved")

    so.status = SOStatus.approved
    db.commit()
    db.refresh(so)
    return so


# ====== Shipments ======

@router.post("/shipments", response_model=ShipmentOut)
def create_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    shp = Shipment(
        shipment_number=generate_shipment_number(),
        so_id=data.so_id,
        status=ShipmentStatus.draft,
        ship_date=data.ship_date or datetime.utcnow(),
    )
    db.add(shp)
    db.flush()

    for line in data.lines:
        if line.qty <= 0:
            raise HTTPException(status_code=400, detail="Line qty must be positive")

        shp_line = ShipmentLine(
            shipment_id=shp.id,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            qty=line.qty,
            unit_cost=line.unit_cost or 0,  # 真正的成本會在 post 時更新
        )
        db.add(shp_line)

    db.commit()
    db.refresh(shp)
    return shp


@router.get("/shipments", response_model=List[ShipmentOut])
def list_shipments(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    so_id: int | None = Query(None),
    status: ShipmentStatus | None = Query(None),
):
    q = db.query(Shipment)
    if so_id is not None:
        q = q.filter(Shipment.so_id == so_id)
    if status is not None:
        q = q.filter(Shipment.status == status)
    return q.order_by(Shipment.ship_date.desc()).all()


@router.get("/shipments/{shipment_id}", response_model=ShipmentOut)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    shp = db.query(Shipment).get(shipment_id)
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shp


@router.post("/shipments/{shipment_id}/post", response_model=ShipmentOut)
def post_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    shp = db.query(Shipment).get(shipment_id)
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")
    if shp.status != ShipmentStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft shipment can be posted")

    # 從庫存扣貨並取得成本，寫回 shipment_line.unit_cost
    for line in shp.lines:
        unit_cost = apply_issue_to_inventory(
            db,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            qty=line.qty,
            ref_type="SHIPMENT",
            ref_id=shp.id,
        )
        line.unit_cost = unit_cost

    shp.status = ShipmentStatus.posted
    db.commit()
    db.refresh(shp)
    return shp
