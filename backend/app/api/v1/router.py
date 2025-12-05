from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, master, inventory, purchasing, sales, log, report

router = APIRouter()

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(master.router)
router.include_router(inventory.router)
router.include_router(purchasing.router)
router.include_router(sales.router)
router.include_router(log.router)
router.include_router(report.router)
