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

from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from auth import (
    authenticate, create_access_token,
    set_session_cookie, clear_session_cookie, require_admin,
)
from password_reset import (
    generate_reset_token, validate_reset_token,
    consume_reset_token, update_env_password, send_reset_email,
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
def login(payload: LoginRequest, response: Response):
    if not authenticate(payload.password):
        logger.warning(
            "Failed admin login attempt",
            extra={"category": "admin", "action": "login_failed"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )

    token = create_access_token()
    set_session_cookie(response, token)

    logger.info(
        "Admin logged in",
        extra={"category": "admin", "action": "login_success"},
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
def forgot_password():
    """
    Generates a one-time reset token and emails it to ADMIN_RECOVERY_EMAIL.
    Always returns 200 regardless of whether the email was sent —
    this prevents email enumeration attacks.
    Public endpoint — no auth required.
    """
    token = generate_reset_token()
    sent  = send_reset_email(token)

    logger.info(
        "Password reset requested",
        extra={
            "category": "admin",
            "action":   "password_reset_requested",
            "email_sent": sent,
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
def reset_password(payload: ResetPasswordRequest, response: Response):
    """
    Validates the reset token and updates the admin password.
    On success: logs the admin in automatically with a fresh session.
    Public endpoint — no auth required (token is the credential).
    """
    if not validate_reset_token(payload.token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters.",
        )

    try:
        update_env_password(payload.new_password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password. Please try again.",
        )

    # Consume the token — single use
    consume_reset_token(payload.token)

    # Log them in automatically
    session_token = create_access_token()
    set_session_cookie(response, session_token)

    return {"message": "Password updated successfully. You are now logged in."}
