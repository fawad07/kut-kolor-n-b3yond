"""
auth.py
-------
Admin authentication for the KKB admin panel.

How it works:
  - A single admin password is stored as a bcrypt hash in .env
  - POST /auth/login checks the password and issues a JWT
  - The JWT is set as an HttpOnly cookie (JS cannot read it — XSS safe)
  - Token expires after 10 minutes of issuance
  - require_admin() is a FastAPI dependency that protects routes —
    add it to any endpoint that should require login

Setup:
  1. Generate a password hash:
       python3 -c "from auth import hash_password; print(hash_password('your-password-here'))"
  2. Add to .env:
       ADMIN_PASSWORD_HASH=$2b$12$....
       JWT_SECRET=<random string, e.g. from: python3 -c "import secrets; print(secrets.token_hex(32))">
"""

import os
import time
import jwt
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi import Request, HTTPException, status, Response
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from logger import get_admin_logger
from models import AdminSetting

load_dotenv()

logger = get_admin_logger()

# ── Config ─────────────────────────────────────────────────
JWT_SECRET           = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM        = "HS256"
TOKEN_EXPIRY_MINUTES = 10  # inactivity timeout
COOKIE_NAME          = "kkb_admin_session"

# Used only to bootstrap the DB the very first time — the live hash is
# stored in the admin_settings table thereafter (survives redeploys).
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _check_jwt():
    if not JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET is not set in .env. "
            "Generate one with: python3 -c \"import secrets; print(secrets.token_hex(32))\""
        )


# ── Login brute-force rate limiting (per IP, in-memory) ───
MAX_FAILED_ATTEMPTS = 5          # before lockout
ATTEMPT_WINDOW_SEC  = 15 * 60    # rolling window
_failed_attempts: dict = defaultdict(list)  # ip -> [timestamps]


def client_ip(request: Request) -> str:
    """Real client IP, honouring X-Forwarded-For when behind a proxy/host."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _recent_attempts(ip: str) -> list:
    now = time.time()
    recent = [t for t in _failed_attempts.get(ip, []) if now - t < ATTEMPT_WINDOW_SEC]
    _failed_attempts[ip] = recent
    return recent


def is_rate_limited(ip: str) -> bool:
    return len(_recent_attempts(ip)) >= MAX_FAILED_ATTEMPTS


def record_failed_attempt(ip: str) -> None:
    _recent_attempts(ip).append(time.time())


def reset_attempts(ip: str) -> None:
    _failed_attempts.pop(ip, None)


# ── Admin password hash — stored in the database ──────────
def get_password_hash(db: Session) -> str:
    """
    Return the current admin password hash from the database.
    On first use, bootstrap it from the ADMIN_PASSWORD_HASH env value.
    """
    setting = db.query(AdminSetting).first()
    if setting:
        return setting.password_hash
    if ADMIN_PASSWORD_HASH:
        setting = AdminSetting(password_hash=ADMIN_PASSWORD_HASH)
        db.add(setting)
        db.commit()
        return ADMIN_PASSWORD_HASH
    return ""


def set_password_hash(db: Session, new_hash: str) -> None:
    """Persist a new admin password hash to the database."""
    setting = db.query(AdminSetting).first()
    if setting:
        setting.password_hash = new_hash
    else:
        db.add(AdminSetting(password_hash=new_hash))
    db.commit()


# ── Password helpers ──────────────────────────────────────
def hash_password(plain_password: str) -> str:
    """Hash a plaintext password for storing in .env. Run once, copy output."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ── Token helpers ──────────────────────────────────────────
def create_access_token() -> str:
    """Create a JWT valid for TOKEN_EXPIRY_MINUTES from now."""
    _check_jwt()
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRY_MINUTES)
    payload = {"sub": "admin", "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT. Raises jwt exceptions on failure."""
    _check_jwt()
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ── Login logic ───────────────────────────────────────────
def authenticate(db: Session, password: str) -> bool:
    _check_jwt()
    current_hash = get_password_hash(db)
    if not current_hash:
        raise RuntimeError(
            "No admin password configured. Set ADMIN_PASSWORD_HASH in .env "
            "to bootstrap the first password."
        )
    return verify_password(password, current_hash)


def set_session_cookie(response: Response, token: str) -> None:
    """
    Set the JWT as an HttpOnly cookie.
    secure=True requires HTTPS — set via COOKIE_SECURE env var for production.
    """
    secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=TOKEN_EXPIRY_MINUTES * 60,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


# ── FastAPI dependency — protects routes ──────────────────
def require_admin(request: Request) -> dict:
    """
    Use as a dependency on any route that requires admin login:

        @router.get("/protected")
        def protected_route(admin: dict = Depends(require_admin)):
            ...

    Raises 401 if no valid session cookie is present.
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
        )

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        logger.warning(
            "Invalid admin token presented",
            extra={"category": "admin", "action": "invalid_token"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session. Please log in again.",
        )

    return payload
