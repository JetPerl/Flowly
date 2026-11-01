# backend/main.py
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import asyncio

from database import engine, Base
from database import get_db
from models import Category, Operation

from models import Account
from schemas import (
    CategoryTreeChild,
    CategoryTreeItem,
    HistoryItem,
    HistorySection,
)

from routers import accounts, operations, categories, rates, tags, saltedge
from services.crypto_service import auto_update_crypto_loop

from fastapi import BackgroundTasks
import time
import requests

app = FastAPI()

# --- Routers ---
app.include_router(accounts.router)
app.include_router(operations.router)
app.include_router(categories.router)
app.include_router(rates.router)
app.include_router(tags.router)
app.include_router(saltedge.router)

from routers import crypto
app.include_router(crypto.router)

# создаём таблицы в БД (если их ещё нет)
Base.metadata.create_all(bind=engine)

@app.get("/ping")
def ping():
    return {"message": "pong"}


@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar_one()
        return {"db_ok": result == 1}

@app.get("/api/health")
def api_health():
    return {"ok": True}

@app.on_event("startup")
async def startup_crypto_auto_updates():
    asyncio.create_task(auto_update_crypto_loop())
