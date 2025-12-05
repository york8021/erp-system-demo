from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import UserRole

from app.models.inventory import InventoryTransaction, InventoryBalance
from app.models.master import Item, Warehouse
from app.schemas.inventory import (
    InventoryTransactionCreate,
    InventoryTransactionOut,
    InventoryBalanceOut,
)
from app.core.logger import write_log

router = APIRouter(prefix="/inventory", tags=["inventory"])

ALLOWED = [
    UserRole.admin,
    UserRole.manager,
    UserRole.sales,
    UserRole.purchasing,
]


# ───────────────────────────
# 建立庫存交易（入庫/出庫）
# 自動維護 InventoryBalance
# ───────────────────────────
@router.post("/transactions", response_model=InventoryTransactionOut)
def create_transaction(
    data: InventoryTransactionCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    _=Depends(require_roles(ALLOWED)),
):
    # 檢查資料
    if not db.query(Item).filter(Item.id == data.item_id).first():
        raise HTTPException(404, "Item not found")

    if not db.query(Warehouse).filter(Warehouse.id == data.warehouse_id).first():
        raise HTTPException(404, "Warehouse not found")

    # 寫入交易
    trx = InventoryTransaction(**data.dict())
    db.add(trx)

    # 更新庫存餘額
    balance = (
        db.query(InventoryBalance)
        .filter(
            InventoryBalance.item_id == data.item_id,
            InventoryBalance.warehouse_id == data.warehouse_id,
        )
        .first()
    )

    if not balance:
        balance = InventoryBalance(
            item_id=data.item_id,
            warehouse_id=data.warehouse_id,
            qty_on_hand=data.qty,
        )
        db.add(balance)
    else:
        balance.qty_on_hand += data.qty

    db.commit()
    db.refresh(trx)

    # 寫入日誌
    write_log(
        db=db,
        user_email=user.email,
        action="Create Inventory Transaction",
        module="inventory",
        ref_id=trx.id,
        details=f"Item={data.item_id}, Warehouse={data.warehouse_id}, Qty={data.qty}, RefType={data.ref_type}, RefId={data.ref_id}"
    )

    return trx


# ───────────────────────────
# 查詢庫存餘額
# ───────────────────────────
@router.get("/balances", response_model=list[InventoryBalanceOut])
def list_balances(
    db: Session = Depends(get_db),
    _=Depends(require_roles(ALLOWED)),
):
    balances = db.query(InventoryBalance).all()
    return balances


# ───────────────────────────
# 查詢庫存交易紀錄
# ───────────────────────────
@router.get("/transactions", response_model=list[InventoryTransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    _=Depends(require_roles(ALLOWED)),
):
    return db.query(InventoryTransaction).order_by(
        InventoryTransaction.timestamp.desc()
    ).all()
