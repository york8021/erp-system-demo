from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import UserRole

from app.models.purchasing import (
    PurchaseOrder, PurchaseOrderLine,
    GoodsReceipt, GoodsReceiptLine,
)
from app.models.master import Item, Vendor, Warehouse
from app.models.inventory import InventoryTransaction, InventoryBalance

from app.schemas.purchasing import (
    POCreate, POOut,
    GRCreate, GROut,
)

from app.core.logger import write_log

router = APIRouter(prefix="/purchasing", tags=["purchasing"])

ALLOWED = [UserRole.admin, UserRole.manager, UserRole.purchasing]


# ───────────────────────────
# 建立 PO（採購訂單）
# ───────────────────────────
@router.post("/po", response_model=POOut)
def create_po(
    data: POCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    _=Depends(require_roles(ALLOWED)),
):
    if not db.query(Vendor).filter(Vendor.id == data.vendor_id).first():
        raise HTTPException(404, "Vendor not found")

    po = PurchaseOrder(vendor_id=data.vendor_id)
    db.add(po)
    db.commit()
    db.refresh(po)

    # 建立 PO 明細
    for line in data.lines:
        if not db.query(Item).filter(Item.id == line.item_id).first():
            raise HTTPException(404, f"Item {line.item_id} not found")

        pol = PurchaseOrderLine(
            po_id=po.id,
            item_id=line.item_id,
            qty=line.qty,
        )
        db.add(pol)

    po.status = "open"
    db.commit()
    db.refresh(po)

    # 寫入日誌
    write_log(
        db=db,
        user_email=user.email,
        action="Create Purchase Order",
        module="purchasing",
        ref_id=po.id,
        details=f"Vendor={data.vendor_id}, lines={len(data.lines)}",
    )

    return po


# ───────────────────────────
# 建立 GR（收貨單）+ 自動入庫
# ───────────────────────────
@router.post("/gr", response_model=GROut)
def create_gr(
    data: GRCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    _=Depends(require_roles(ALLOWED)),
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == data.po_id).first()
    if not po:
        raise HTTPException(404, "PO not found")

    wh = db.query(Warehouse).filter(Warehouse.id == data.warehouse_id).first()
    if not wh:
        raise HTTPException(404, "Warehouse not found")

    # 建立 GR 主檔
    gr = GoodsReceipt(po_id=data.po_id, warehouse_id=data.warehouse_id)
    db.add(gr)
    db.commit()
    db.refresh(gr)

    # 寫入 GR 明細、庫存交易與庫存餘額
    for line in data.lines:
        item = db.query(Item).filter(Item.id == line.item_id).first()
        if not item:
            raise HTTPException(404, f"Item {line.item_id} not found")

        # GR Line
        grl = GoodsReceiptLine(
            gr_id=gr.id,
            item_id=line.item_id,
            qty=line.qty,
        )
        db.add(grl)

        # 庫存交易（入庫：qty 為正）
        trx = InventoryTransaction(
            item_id=line.item_id,
            warehouse_id=data.warehouse_id,
            qty=line.qty,
            ref_type="purchase",
            ref_id=gr.id,
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
            balance = InventoryBalance(
                item_id=line.item_id,
                warehouse_id=data.warehouse_id,
                qty_on_hand=line.qty,
            )
            db.add(balance)
        else:
            balance.qty_on_hand += line.qty

        # 每一行也可以記一次細部日誌（可選）
        write_log(
            db=db,
            user_email=user.email,
            action="GR Line Received",
            module="purchasing",
            ref_id=gr.id,
            details=f"Item={line.item_id}, Qty={line.qty}, Warehouse={data.warehouse_id}",
        )

    # 關閉 PO（簡單處理：收一次就關）
    po.status = "closed"
    db.commit()
    db.refresh(gr)

    # 整張 GR 的總體日誌
    write_log(
        db=db,
        user_email=user.email,
        action="Create Goods Receipt",
        module="purchasing",
        ref_id=gr.id,
        details=f"PO={data.po_id}, Warehouse={data.warehouse_id}, lines={len(data.lines)}",
    )

    return gr
