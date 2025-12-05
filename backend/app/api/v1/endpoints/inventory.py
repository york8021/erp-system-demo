from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import InventoryTransaction, InventoryBalance
from app.schemas.inventory import (
    InventoryTransactionOut,
    InventoryBalanceOut,
)
from app.models.user import User

router = APIRouter()


@router.get("/transactions", response_model=List[InventoryTransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    item_id: int | None = Query(None),
    warehouse_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    q = db.query(InventoryTransaction)
    if item_id is not None:
        q = q.filter(InventoryTransaction.item_id == item_id)
    if warehouse_id is not None:
        q = q.filter(InventoryTransaction.warehouse_id == warehouse_id)
    q = q.order_by(InventoryTransaction.txn_time.desc())
    return q.limit(limit).all()


@router.get("/balances", response_model=List[InventoryBalanceOut])
def list_balances(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    item_id: int | None = Query(None),
    warehouse_id: int | None = Query(None),
):
    q = db.query(InventoryBalance)
    if item_id is not None:
        q = q.filter(InventoryBalance.item_id == item_id)
    if warehouse_id is not None:
        q = q.filter(InventoryBalance.warehouse_id == warehouse_id)
    return q.all()
