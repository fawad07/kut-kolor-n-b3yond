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
import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from database import engine, Base
from routers import bookings, contact, logs, auth_router, payments
from logger import log_server_start, get_request_logger
from auth import client_ip

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

# ── Request logging middleware ────────────────────────────
# Logs EVERY request (method, path, status, IP, duration) so nothing is
# left unaudited. Unhandled errors are logged with a full traceback.
# The log-viewer and health endpoints are skipped so reading the audit
# log (and uptime pings) don't flood it with self-referential noise.
request_logger = get_request_logger()
_SKIP_LOG_PREFIXES = ("/logs", "/health", "/docs", "/redoc", "/openapi.json")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    path = request.url.path
    if path == "/" or path.startswith(_SKIP_LOG_PREFIXES):
        return await call_next(request)

    start = time.time()
    ip = client_ip(request)
    try:
        response = await call_next(request)
    except Exception:
        duration = round((time.time() - start) * 1000, 1)
        request_logger.error(
            f"{request.method} {path} → 500 (unhandled)",
            extra={
                "category": "request", "action": "request_error",
                "method": request.method, "path": path,
                "status_code": 500, "ip": ip, "duration_ms": duration,
            },
            exc_info=True,
        )
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    duration = round((time.time() - start) * 1000, 1)
    code = response.status_code
    level = logging.INFO if code < 400 else logging.WARNING if code < 500 else logging.ERROR
    request_logger.log(
        level,
        f"{request.method} {path} → {code}",
        extra={
            "category": "request", "action": "http_request",
            "method": request.method, "path": path,
            "query": request.url.query or "",
            "status_code": code, "ip": ip, "duration_ms": duration,
        },
    )
    return response


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
