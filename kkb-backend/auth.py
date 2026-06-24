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
import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi import Request, HTTPException, status, Response
from dotenv import load_dotenv
from logger import get_admin_logger

load_dotenv()

logger = get_admin_logger()

# ── Config ─────────────────────────────────────────────────
JWT_SECRET           = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM        = "HS256"
TOKEN_EXPIRY_MINUTES = 10  # inactivity timeout
COOKIE_NAME          = "kkb_admin_session"

ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _check_config():
    if not JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET is not set in .env. "
            "Generate one with: python3 -c \"import secrets; print(secrets.token_hex(32))\""
        )
    if not ADMIN_PASSWORD_HASH:
        raise RuntimeError(
            "ADMIN_PASSWORD_HASH is not set in .env. "
            "Generate one with: python3 -c \"from auth import hash_password; print(hash_password('your-password'))\""
        )


# ── Password helpers ──────────────────────────────────────
def hash_password(plain_password: str) -> str:
    """Hash a plaintext password for storing in .env. Run once, copy output."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ── Token helpers ──────────────────────────────────────────
def create_access_token() -> str:
    """Create a JWT valid for TOKEN_EXPIRY_MINUTES from now."""
    _check_config()
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRY_MINUTES)
    payload = {"sub": "admin", "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT. Raises jwt exceptions on failure."""
    _check_config()
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ── Login logic ───────────────────────────────────────────
def authenticate(password: str) -> bool:
    _check_config()
    return verify_password(password, ADMIN_PASSWORD_HASH)


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
