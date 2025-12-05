from fastapi import FastAPI

from app.api.v1.router import api_router
from app.models.base import Base
from app.db.session import engine
from app.db.init_db import init_admin

app = FastAPI(title="ERP Backend")

# 建立資料表
Base.metadata.create_all(bind=engine)

# 初始化預設 admin（若不存在）
init_admin()

# API Router
app.include_router(api_router, prefix="/api/v1")
