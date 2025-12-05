# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.api.v1.router import router as api_router
from app.seed.initial_data import init_db

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS 設定（開發階段先全開比較省事）
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 建表
Base.metadata.create_all(bind=engine)

# 種子資料：admin 帳號
with SessionLocal() as db:
  init_db(db)

@app.get("/")
def root():
  return {"message": "ERP backend running"}

# 掛上 v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)
