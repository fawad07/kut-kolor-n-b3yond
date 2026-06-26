"""
routers/auth_router.py
----------------
Endpoints:
  POST /auth/login          — verify password, issue session cookie
  POST /auth/logout         — clear session cookie
  GET  /auth/check          — verify session, refresh expiry (sliding window)
  POST /auth/forgot-password — send reset link to recovery email
  POST /auth/reset-password  — validate token and set new password
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth import (
    authenticate, create_access_token,
    set_session_cookie, clear_session_cookie, require_admin,
    client_ip, is_rate_limited, record_failed_attempt, reset_attempts,
)
from password_reset import (
    generate_reset_token, validate_reset_token,
    consume_reset_token, update_admin_password, is_same_as_current,
    send_reset_email,
)
from logger import get_admin_logger

logger = get_admin_logger()

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    password: str


class ResetPasswordRequest(BaseModel):
    token:        str
    new_password: str


@router.post("/login", summary="Admin login — verify password and start session")
def login(
    payload:  LoginRequest,
    request:  Request,
    response: Response,
    db:       Session = Depends(get_db),
):
    ip = client_ip(request)

    # Brute-force protection — block after too many failures from one IP
    if is_rate_limited(ip):
        logger.warning(
            "Admin login blocked — too many attempts",
            extra={"category": "admin", "action": "login_rate_limited", "ip": ip},
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please wait 15 minutes and try again.",
        )

    if not authenticate(db, payload.password):
        record_failed_attempt(ip)
        logger.warning(
            "Failed admin login attempt",
            extra={"category": "admin", "action": "login_failed", "ip": ip},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )

    # Success — clear the failure counter for this IP
    reset_attempts(ip)

    token = create_access_token()
    set_session_cookie(response, token)

    logger.info(
        "Admin logged in",
        extra={"category": "admin", "action": "login_success", "ip": ip},
    )
    return {"message": "Logged in successfully"}


@router.post("/logout", summary="Admin logout — clear session")
def logout(response: Response, reason: str = "manual"):
    clear_session_cookie(response)
    logger.info(
        f"Admin logged out — {reason}",
        extra={"category": "admin", "action": "logout", "reason": reason},
    )
    return {"message": "Logged out successfully"}


@router.get("/check", summary="Check session validity and refresh expiry")
def check_session(response: Response, admin: dict = Depends(require_admin)):
    """
    Called periodically by the frontend while the admin panel is open.
    Issues a fresh token on each call — implements sliding inactivity timeout.
    """
    new_token = create_access_token()
    set_session_cookie(response, new_token)
    return {"authenticated": True}


@router.post("/forgot-password", summary="Request a password reset link")
def forgot_password(request: Request, db: Session = Depends(get_db)):
    """
    Generates a one-time reset token and emails it to ADMIN_RECOVERY_EMAIL.
    Always returns 200 regardless of whether the email was sent —
    this prevents email enumeration attacks.
    Public endpoint — no auth required.
    """
    ip    = client_ip(request)
    token = generate_reset_token(db)
    sent  = send_reset_email(token)

    logger.info(
        "Password reset requested",
        extra={
            "category":   "admin",
            "action":     "password_reset_requested",
            "email_sent": sent,
            "ip":         ip,
        },
    )

    # Always return the same message — never reveal if email exists/was sent
    return {
        "message": (
            "If a recovery email is configured, a reset link has been sent. "
            f"The link expires in 15 minutes."
        )
    }


@router.post("/reset-password", summary="Set a new admin password using a reset token")
def reset_password(
    payload:  ResetPasswordRequest,
    request:  Request,
    response: Response,
    db:       Session = Depends(get_db),
):
    """
    Validates the reset token and updates the admin password.
    On success: logs the admin in automatically with a fresh session.
    Public endpoint — no auth required (token is the credential).

    Every outcome — success and each failure type — is logged with the
    requester's IP so a full audit trail is available.
    """
    ip = client_ip(request)

    if not validate_reset_token(db, payload.token):
        logger.warning(
            "Password reset failed — invalid or expired token",
            extra={"category": "admin", "action": "password_reset_failed",
                   "reason": "invalid_or_expired_token", "ip": ip},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    if len(payload.new_password) < 8:
        logger.warning(
            "Password reset failed — new password too short",
            extra={"category": "admin", "action": "password_reset_failed",
                   "reason": "password_too_short", "ip": ip},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters.",
        )

    # Don't allow re-using the current password
    if is_same_as_current(db, payload.new_password):
        logger.warning(
            "Password reset failed — reuse of current password",
            extra={"category": "admin", "action": "password_reset_failed",
                   "reason": "password_reused", "ip": ip},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    try:
        update_admin_password(db, payload.new_password)
    except Exception as e:
        logger.error(
            "Password reset error — could not update password",
            extra={"category": "admin", "action": "password_reset_error",
                   "reason": str(e), "ip": ip},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password. Please try again.",
        )

    # Consume the token — single use
    consume_reset_token(db, payload.token)

    logger.info(
        "Admin password changed via reset",
        extra={"category": "admin", "action": "password_reset_completed", "ip": ip},
    )

    # Log them in automatically
    session_token = create_access_token()
    set_session_cookie(response, session_token)

    return {"message": "Password updated successfully. You are now logged in."}
