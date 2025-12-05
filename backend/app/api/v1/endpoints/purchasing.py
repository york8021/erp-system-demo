from datetime import datetime
import time
from typing import List

from app.api.deps import get_current_user, require_admin, require_roles

from app.db.session import get_db
from app.models import (
    PurchaseOrder,
    PurchaseOrderLine,
    GoodsReceipt,
    GoodsReceiptLine,
    POStatus,
    GRStatus,
    InventoryTransaction,
    InventoryBalance,
    InventoryTxnType,
)
from app.schemas.purchasing import (
    PurchaseOrderCreate,
    PurchaseOrderOut,
    GoodsReceiptCreate,
    GoodsReceiptOut,
)
from app.models.user import User, UserRole

router = APIRouter()

ALLOWED_PURCHASING_ROLES = [
    UserRole.admin,
    UserRole.manager,
    UserRole.purchasing,
]

ALLOWED_PURCHASING_APPROVE_ROLES = [
    UserRole.admin,
    UserRole.manager,
]


# ====== 工具函式：產生單號 ======

def generate_po_number() -> str:
    # 簡單版：PO-時間戳，避免衝突即可，之後要換規則再改
    return f"PO-{int(time.time() * 1000)}"


def generate_gr_number() -> str:
    return f"GR-{int(time.time() * 1000)}"


# ====== 工具函式：庫存處理（移動平均成本） ======

def apply_receipt_to_inventory(
    db: Session,
    *,
    item_id: int,
    warehouse_id: int,
    qty: int,
    unit_cost: float,
    ref_type: str,
    ref_id: int,
):
    if qty <= 0:
        raise ValueError("qty must be positive")

    # 先找 existing balance
    balance = (
        db.query(InventoryBalance)
        .filter(
            InventoryBalance.item_id == item_id,
            InventoryBalance.warehouse_id == warehouse_id,
        )
        .first()
    )

    if balance is None:
        balance = InventoryBalance(
            item_id=item_id,
            warehouse_id=warehouse_id,
            qty=0,
            avg_cost=0,
        )
        db.add(balance)
        db.flush()

    old_qty = balance.qty or 0
    old_cost = float(balance.avg_cost or 0)
    in_qty = qty
    in_cost = float(unit_cost)

    new_qty = old_qty + in_qty
    if new_qty <= 0:
        new_avg_cost = 0
    else:
        new_avg_cost = ((old_qty * old_cost) + (in_qty * in_cost)) / new_qty

    balance.qty = new_qty
    balance.avg_cost = new_avg_cost

    txn = InventoryTransaction(
        txn_type=InventoryTxnType.RECEIPT,
        item_id=item_id,
        warehouse_id=warehouse_id,
        qty=in_qty,
        unit_cost=in_cost,
        ref_type=ref_type,
        ref_id=ref_id,
        txn_time=datetime.utcnow(),
    )
    db.add(txn)


# ====== Purchase Orders ======

@router.post("/purchase-orders", response_model=PurchaseOrderOut)
def create_po(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_ROLES)),
):
    # 建 PO 主檔
    po = PurchaseOrder(
        po_number=generate_po_number(),
        vendor_id=data.vendor_id,
        status=POStatus.draft,
        order_date=data.order_date or datetime.utcnow(),
    )
    db.add(po)
    db.flush()  # 先拿到 po.id

    # 建明細
    for line in data.lines:
        if line.qty <= 0:
            raise HTTPException(status_code=400, detail="Line qty must be positive")
        if line.unit_price < 0:
            raise HTTPException(status_code=400, detail="unit_price cannot be negative")
        po_line = PurchaseOrderLine(
            po_id=po.id,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            qty=line.qty,
            unit_price=line.unit_price,
        )
        db.add(po_line)

    db.commit()
    db.refresh(po)
    return po


@router.get("/purchase-orders", response_model=List[PurchaseOrderOut])
def list_po(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_ROLES)),
    vendor_id: int | None = Query(None),
    status: POStatus | None = Query(None),
):
    q = db.query(PurchaseOrder)
    if vendor_id is not None:
        q = q.filter(PurchaseOrder.vendor_id == vendor_id)
    if status is not None:
        q = q.filter(PurchaseOrder.status == status)
    return q.order_by(PurchaseOrder.order_date.desc()).all()


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderOut)
def get_po(
    po_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_ROLES)),
):
    po = db.query(PurchaseOrder).get(po_id)
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    return po


@router.post("/purchase-orders/{po_id}/approve", response_model=PurchaseOrderOut)
def approve_po(
    po_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_APPROVE_ROLES)),
):
    po = db.query(PurchaseOrder).get(po_id)
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status != POStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft PO can be approved")

    po.status = POStatus.approved
    db.commit()
    db.refresh(po)
    return po


# ====== Goods Receipts ======

@router.post("/goods-receipts", response_model=GoodsReceiptOut)
def create_gr(
    data: GoodsReceiptCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_ROLES)),
):
    gr = GoodsReceipt(
        gr_number=generate_gr_number(),
        po_id=data.po_id,
        status=GRStatus.draft,
        receipt_date=data.receipt_date or datetime.utcnow(),
    )
    db.add(gr)
    db.flush()

    for line in data.lines:
        if line.qty <= 0:
            raise HTTPException(status_code=400, detail="Line qty must be positive")
        if line.unit_cost < 0:
            raise HTTPException(status_code=400, detail="unit_cost cannot be negative")

        gr_line = GoodsReceiptLine(
            gr_id=gr.id,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            qty=line.qty,
            unit_cost=line.unit_cost,
        )
        db.add(gr_line)

    db.commit()
    db.refresh(gr)
    return gr


@router.get("/goods-receipts", response_model=List[GoodsReceiptOut])
def list_gr(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_ROLES)),
    po_id: int | None = Query(None),
    status: GRStatus | None = Query(None),
):
    q = db.query(GoodsReceipt)
    if po_id is not None:
        q = q.filter(GoodsReceipt.po_id == po_id)
    if status is not None:
        q = q.filter(GoodsReceipt.status == status)
    return q.order_by(GoodsReceipt.receipt_date.desc()).all()


@router.get("/goods-receipts/{gr_id}", response_model=GoodsReceiptOut)
def get_gr(
    gr_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_ROLES)),
):
    gr = db.query(GoodsReceipt).get(gr_id)
    if not gr:
        raise HTTPException(status_code=404, detail="GR not found")
    return gr


@router.post("/goods-receipts/{gr_id}/post", response_model=GoodsReceiptOut)
def post_gr(
    gr_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(ALLOWED_PURCHASING_APPROVE_ROLES)),
):
    gr = db.query(GoodsReceipt).get(gr_id)
    if not gr:
        raise HTTPException(status_code=404, detail="GR not found")
    if gr.status != GRStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft GR can be posted")

    # 填庫存交易 & 更新移動平均
    for line in gr.lines:
        apply_receipt_to_inventory(
            db,
            item_id=line.item_id,
            warehouse_id=line.warehouse_id,
            qty=line.qty,
            unit_cost=float(line.unit_cost),
            ref_type="GR",
            ref_id=gr.id,
        )

    gr.status = GRStatus.posted
    db.commit()
    db.refresh(gr)
    return gr
