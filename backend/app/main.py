from fastapi import FastAPI

from app.api.v1.router import router
from app.models.base import Base
from app.db.session import engine
from app.db.init_db import init_admin

app = FastAPI(title="ERP Backend")

Base.metadata.create_all(bind=engine)
init_admin()

app.include_router(router, prefix="/api/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
