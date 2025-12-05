from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_roles
from app.models.user import UserRole
from app.models.inventory import InventoryTransaction, InventoryBalance
from app.models.purchasing import PurchaseOrderLine, PurchaseOrder
from app.models.sales import SalesOrderLine, SalesOrder
from app.models.master import Item, Vendor, Customer

router = APIRouter(prefix="/report", tags=["report"])

ALLOWED = [
    UserRole.admin,
    UserRole.manager
]


# ───────────────────────────
# 庫存即時報表
# ───────────────────────────
@router.get("/inventory")
def inventory_report(
    db: Session = Depends(get_db),
    _=Depends(require_roles(ALLOWED))
):
    balances = db.query(InventoryBalance).all()

    result = []
    for b in balances:
        result.append({
            "item_id": b.item_id,
            "warehouse_id": b.warehouse_id,
            "qty_on_hand": b.qty_on_hand
        })

    return result


# ───────────────────────────
# 採購報表：按 Vendor 彙總
# ───────────────────────────
@router.get("/purchasing/vendor-summary")
def vendor_summary(db: Session = Depends(get_db), _=Depends(require_roles(ALLOWED))):
    rows = (
        db.query(
            Vendor.name,
            PurchaseOrderLine.item_id,
            PurchaseOrderLine.qty
        )
        .join(PurchaseOrder, PurchaseOrder.id == PurchaseOrderLine.po_id)
        .join(Vendor, Vendor.id == PurchaseOrder.vendor_id)
        .all()
    )

    summary = {}
    for vendor_name, item_id, qty in rows:
        summary.setdefault(vendor_name, 0)
        summary[vendor_name] += qty

    return summary


# ───────────────────────────
# 銷售報表：按 Customer 彙總
# ───────────────────────────
@router.get("/sales/customer-summary")
def customer_summary(db: Session = Depends(get_db), _=Depends(require_roles(ALLOWED))):
    rows = (
        db.query(
            Customer.name,
            SalesOrderLine.item_id,
            SalesOrderLine.qty
        )
        .join(SalesOrder, SalesOrder.id == SalesOrderLine.so_id)
        .join(Customer, Customer.id == SalesOrder.customer_id)
        .all()
    )

    summary = {}
    for customer_name, item_id, qty in rows:
        summary.setdefault(customer_name, 0)
        summary[customer_name] += qty

    return summary
