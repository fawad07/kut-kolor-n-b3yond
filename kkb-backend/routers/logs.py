"""
routers/logs.py
---------------
Endpoints:
  GET /logs/recent   — returns the last N log entries from app.log
  GET /logs/bookings — returns recent booking-specific entries
  GET /logs/admin    — returns recent admin action entries
  GET /logs/errors   — returns recent error entries
"""

import os
import json
from fastapi import APIRouter, Query, Depends
from typing import List, Optional

from auth import require_admin

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")

router = APIRouter(
    prefix="/logs",
    tags=["Logs"],
)


def read_log_file(filename: str, limit: int = 100, category: Optional[str] = None) -> List[dict]:
    """
    Read the last `limit` lines from a log file.
    Optionally filter by category field.
    Returns newest entries first.
    """
    path = os.path.join(LOG_DIR, filename)
    if not os.path.exists(path):
        return []

    entries = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Parse JSON lines newest first
        for line in reversed(lines):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                if category and entry.get("category") != category:
                    continue
                entries.append(entry)
                if len(entries) >= limit:
                    break
            except json.JSONDecodeError:
                continue

    except Exception as e:
        return [{"level": "ERROR", "message": f"Could not read log file: {str(e)}"}]

    return entries


@router.get(
    "/recent",
    summary="Get recent log entries from app.log",
)
def get_recent_logs(
    limit:    int           = Query(default=50, le=200),
    category: Optional[str] = Query(default=None),
    level:    Optional[str] = Query(default=None),
    admin:    dict          = Depends(require_admin),
):
    """
    Returns the most recent log entries.
    Optional filters: category (booking|contact|admin|server|error), level (INFO|WARNING|ERROR)
    """
    entries = read_log_file("app.log", limit=limit * 2, category=category)
    if level:
        entries = [e for e in entries if e.get("level") == level.upper()]
    return entries[:limit]


@router.get(
    "/bookings",
    summary="Get recent booking log entries",
)
def get_booking_logs(
    limit: int  = Query(default=50, le=200),
    admin: dict = Depends(require_admin),
):
    return read_log_file("bookings.log", limit=limit)


@router.get(
    "/admin",
    summary="Get recent admin action log entries",
)
def get_admin_logs(
    limit: int  = Query(default=50, le=200),
    admin: dict = Depends(require_admin),
):
    return read_log_file("admin.log", limit=limit)


@router.get(
    "/errors",
    summary="Get recent error log entries",
)
def get_error_logs(
    limit: int  = Query(default=50, le=200),
    admin: dict = Depends(require_admin),
):
    return read_log_file("errors.log", limit=limit)
