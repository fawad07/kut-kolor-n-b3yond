"""
logger.py
---------
Centralised logging for the KKB backend.

Log files (in /logs/):
  app.log       — everything (all levels)
  bookings.log  — booking events only
  errors.log    — warnings and errors only
  admin.log     — admin actions only

Rotation: daily at midnight, keep 30 days of history.
Format:   JSON-structured lines for easy parsing.
"""

import logging
import json
import os
from datetime import datetime, timezone
from logging.handlers import TimedRotatingFileHandler

# ── Log directory ─────────────────────────────────────────
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)


# ── JSON formatter ────────────────────────────────────────
class JSONFormatter(logging.Formatter):
    """Formats every log record as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level":     record.levelname,
            "logger":    record.name,
            "message":   record.getMessage(),
        }
        # Merge any extra fields passed via the `extra` dict
        for key, value in record.__dict__.items():
            if key not in (
                "name", "msg", "args", "levelname", "levelno",
                "pathname", "filename", "module", "exc_info",
                "exc_text", "stack_info", "lineno", "funcName",
                "created", "msecs", "relativeCreated", "thread",
                "threadName", "processName", "process", "message",
                "taskName",
            ):
                log_obj[key] = value

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj, default=str)


def _make_handler(filename: str, level: int = logging.DEBUG) -> TimedRotatingFileHandler:
    """Create a daily-rotating file handler."""
    path = os.path.join(LOG_DIR, filename)
    handler = TimedRotatingFileHandler(
        path,
        when="midnight",       # rotate at midnight
        interval=1,            # every 1 day
        backupCount=30,        # keep 30 days
        encoding="utf-8",
        utc=True,
    )
    handler.setLevel(level)
    handler.setFormatter(JSONFormatter())
    # Suffix for rotated files: app.log.2026-06-10
    handler.suffix = "%Y-%m-%d"
    return handler


# ── Root app logger ───────────────────────────────────────
def get_logger(name: str) -> logging.Logger:
    """
    Return a named logger that writes to:
      - app.log    (everything)
      - errors.log (WARNING and above)
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # already configured

    logger.setLevel(logging.DEBUG)
    logger.addHandler(_make_handler("app.log",    logging.DEBUG))
    logger.addHandler(_make_handler("errors.log", logging.WARNING))
    logger.propagate = False
    return logger


# ── Specialist loggers ────────────────────────────────────
def get_booking_logger() -> logging.Logger:
    """Logger that also writes to bookings.log."""
    logger = logging.getLogger("kkb.bookings")
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    logger.addHandler(_make_handler("app.log",      logging.DEBUG))
    logger.addHandler(_make_handler("bookings.log", logging.DEBUG))
    logger.addHandler(_make_handler("errors.log",   logging.WARNING))
    logger.propagate = False
    return logger


def get_admin_logger() -> logging.Logger:
    """Logger that also writes to admin.log."""
    logger = logging.getLogger("kkb.admin")
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    logger.addHandler(_make_handler("app.log",   logging.DEBUG))
    logger.addHandler(_make_handler("admin.log", logging.DEBUG))
    logger.addHandler(_make_handler("errors.log", logging.WARNING))
    logger.propagate = False
    return logger


def get_contact_logger() -> logging.Logger:
    """Logger for contact message events."""
    logger = logging.getLogger("kkb.contact")
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    logger.addHandler(_make_handler("app.log",   logging.DEBUG))
    logger.addHandler(_make_handler("errors.log", logging.WARNING))
    logger.propagate = False
    return logger


# ── Convenience log functions ─────────────────────────────

def log_booking_created(booking) -> None:
    get_booking_logger().info(
        "Booking created",
        extra={
            "category":   "booking",
            "action":     "created",
            "booking_id": booking.id,
            "client":     booking.full_name,
            "email":      booking.email,
            "service":    booking.service,
            "stylist":    booking.stylist,
            "date":       booking.preferred_date,
            "time":       booking.preferred_time,
            "status":     booking.status.value,
        },
    )


def log_booking_conflict(date: str, time: str, stylist: str) -> None:
    get_booking_logger().warning(
        "Booking conflict blocked",
        extra={
            "category": "booking",
            "action":   "conflict_blocked",
            "date":     date,
            "time":     time,
            "stylist":  stylist,
        },
    )


def log_booking_status_changed(booking_id: int, old_status: str, new_status: str, by: str = "admin") -> None:
    get_admin_logger().info(
        "Booking status changed",
        extra={
            "category":   "booking",
            "action":     "status_changed",
            "booking_id": booking_id,
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": by,
        },
    )


def log_booking_edited(booking_id: int, changes: dict) -> None:
    get_admin_logger().info(
        "Booking edited by admin (override)",
        extra={
            "category":   "admin",
            "action":     "booking_edited",
            "booking_id": booking_id,
            "changes":    changes,
        },
    )


def log_booking_deleted(booking_id: int, client: str) -> None:
    get_admin_logger().warning(
        "Booking deleted by admin",
        extra={
            "category":   "admin",
            "action":     "booking_deleted",
            "booking_id": booking_id,
            "client":     client,
        },
    )


def log_contact_created(message) -> None:
    get_contact_logger().info(
        "Contact message received",
        extra={
            "category":     "contact",
            "action":       "created",
            "message_id":   message.id,
            # NOTE: "name" is a reserved LogRecord field — using it in `extra`
            # raises KeyError and 500s the request. Use "client_name" instead.
            "client_name":  message.name,
            "email":        message.email,
        },
    )


def log_contact_status_changed(message_id: int, new_status: str) -> None:
    get_admin_logger().info(
        "Contact message status changed",
        extra={
            "category":   "contact",
            "action":     "status_changed",
            "message_id": message_id,
            "new_status": new_status,
        },
    )


def log_contact_deleted(message_id: int) -> None:
    get_admin_logger().warning(
        "Contact message deleted",
        extra={
            "category":   "contact",
            "action":     "message_deleted",
            "message_id": message_id,
        },
    )


def log_server_start() -> None:
    get_logger("kkb.server").info(
        "Server started",
        extra={"category": "server", "action": "startup"},
    )


def log_error(context: str, error: Exception) -> None:
    get_logger("kkb.error").error(
        f"Error in {context}: {str(error)}",
        extra={"category": "error", "context": context, "error": str(error)},
        exc_info=True,
    )
