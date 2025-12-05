from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import UserRole

from app.models.sales import (
    SalesOrder,
    SalesOrderLine,
    Shipment,
    ShipmentLine,
)
from app.models.master import Customer, Item, Warehouse
from app.models.inventory import InventoryTransaction, InventoryBalance

from app.schemas.sales import (
    SOCreate,
    SOOut,
    ShipmentCreate,
    ShipmentOut,
)

from app.core.logger import write_log

router = APIRouter(prefix="/sales", tags=["sales"])

ALLOWED = [UserRole.admin, UserRole.manager, UserRole.sales]


# ───────────────────────────
# 建立 SO（銷售訂單）
# ───────────────────────────
@router.post("/so", response_model=SOOut)
def create_so(
    data: SOCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    _=Depends(require_roles(ALLOWED)),
):
    customer = (
        db.query(Customer).filter(Customer.id == data.customer_id).first()
    )
    if not customer:
        raise HTTPException(404, "Customer not found")

    so = SalesOrder(customer_id=data.customer_id)
    db.add(so)
    db.commit()
    db.refresh(so)

    for line in data.lines:
        item = db.query(Item).filter(Item.id == line.item_id).first()
        if not item:
            raise HTTPException(404, f"Item {line.item_id} not found")

        sol = SalesOrderLine(
            so_id=so.id,
            item_id=line.item_id,
            qty=line.qty,
        )
        db.add(sol)

    db.commit()
    db.refresh(so)

    # 寫入日誌：建立 SO
    write_log(
        db=db,
        user_email=user.email,
        action="Create Sales Order",
        module="sales",
        ref_id=so.id,
        details=f"Customer={data.customer_id}, lines={len(data.lines)}",
    )

    return so


# ───────────────────────────
# 建立 Shipment（出貨）+ 扣庫存
# ───────────────────────────
@router.post("/shipment", response_model=ShipmentOut)
def create_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    _=Depends(require_roles(ALLOWED)),
):
    so = db.query(SalesOrder).filter(SalesOrder.id == data.so_id).first()
    if not so:
        raise HTTPException(404, "Sales order not found")

    wh = db.query(Warehouse).filter(Warehouse.id == data.warehouse_id).first()
    if not wh:
        raise HTTPException(404, "Warehouse not found")

    # 建立出貨主檔
    shipment = Shipment(so_id=data.so_id, warehouse_id=data.warehouse_id)
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    # 處理 Shipment 明細 + 庫存交易 & 餘額更新
    for line in data.lines:
        item = db.query(Item).filter(Item.id == line.item_id).first()
        if not item:
            raise HTTPException(404, f"Item {line.item_id} not found")

        # Shipment 明細
        sl = ShipmentLine(
            shipment_id=shipment.id,
            item_id=line.item_id,
            qty=line.qty,
        )
        db.add(sl)

        # 庫存交易（出庫：qty 為負）
        trx = InventoryTransaction(
            item_id=line.item_id,
            warehouse_id=data.warehouse_id,
            qty=-line.qty,
            ref_type="sale",
            ref_id=shipment.id,
        )
        db.add(trx)

        # 更新庫存餘額
        balance = (
            db.query(InventoryBalance)
            .filter(
                InventoryBalance.item_id == line.item_id,
                InventoryBalance.warehouse_id == data.warehouse_id,
            )
            .first()
        )

        if not balance:
            # 如果沒庫存紀錄就變成負庫存（代表超賣）
            balance = InventoryBalance(
                item_id=line.item_id,
                warehouse_id=data.warehouse_id,
                qty_on_hand=-line.qty,
            )
            db.add(balance)
        else:
            balance.qty_on_hand -= line.qty

        # 每一行出貨的細部日誌（可視需要保留）
        write_log(
            db=db,
            user_email=user.email,
            action="Shipment Line Shipped",
            module="sales",
            ref_id=shipment.id,
            details=f"Item={line.item_id}, Qty={line.qty}, Warehouse={data.warehouse_id}",
        )

    # 更新 SO 狀態（簡單版：出一次貨就視為 shipped）
    so.status = "shipped"
    db.commit()
    db.refresh(shipment)

    # 整張出貨單的總體日誌
    write_log(
        db=db,
        user_email=user.email,
        action="Create Shipment",
        module="sales",
        ref_id=shipment.id,
        details=f"SO={data.so_id}, Warehouse={data.warehouse_id}, lines={len(data.lines)}",
    )

    return shipment
