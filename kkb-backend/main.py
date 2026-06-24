"""
main.py
-------
FastAPI application entry point.

Run with:
    uvicorn main:app --reload --port 8000

Interactive API docs available at:
    http://localhost:8000/docs
    http://localhost:8000/redoc
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
from routers import bookings, contact, logs, auth_router, payments
from logger import log_server_start

load_dotenv()

# ── Create all tables on startup ──────────────────────────
# In production you would use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

# ── App instance ──────────────────────────────────────────
APP_ENV = os.getenv("APP_ENV", "development")
IS_DEV  = APP_ENV == "development"

app = FastAPI(
    title="Kut, Kolor N B3yond — API",
    description="Backend API for the KKB salon booking and contact system.",
    version="0.1.0",
    docs_url="/docs"  if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
)

# ── CORS ──────────────────────────────────────────────────
# Allows the React frontend (localhost:5173) to call this API.
# In production replace with your actual deployed frontend URL.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────
app.include_router(bookings.router)
app.include_router(contact.router)
app.include_router(logs.router)
app.include_router(auth_router.router)
app.include_router(payments.router)


# ── Startup event ────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    log_server_start()

# ── Health check ──────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    """Health check — confirms the API is running."""
    return {
        "status": "ok",
        "message": "Kut, Kolor N B3yond API is running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
