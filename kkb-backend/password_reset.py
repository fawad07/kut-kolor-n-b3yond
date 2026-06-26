"""
password_reset.py
-----------------
Handles the full password reset flow:
  1. Admin requests reset → generates a secure token, emails a link
  2. Admin clicks link → token validated
  3. Admin enters new password → hash written back to .env

Reset tokens:
  - Stored in memory (dict) — no DB needed
  - Expire after 15 minutes
  - Single use — deleted after successful reset
  - Cryptographically random (32 bytes)

.env update:
  - Reads the current .env file
  - Replaces the ADMIN_PASSWORD_HASH line
  - Writes it back — all other values preserved
"""

import os
import secrets
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from auth import hash_password, verify_password, get_password_hash, set_password_hash
from models import PasswordResetToken
from logger import get_admin_logger

load_dotenv()

logger = get_admin_logger()

RESEND_API_KEY       = os.getenv("RESEND_API_KEY", "")
SALON_EMAIL_FROM     = os.getenv("SALON_EMAIL_FROM", "onboarding@resend.dev")
SALON_NAME           = os.getenv("SALON_NAME", "Kut, Kolor N B3yond")
ADMIN_RECOVERY_EMAIL = os.getenv("ADMIN_RECOVERY_EMAIL", "")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:5173")

TOKEN_EXPIRY_MINUTES = 15


# ── Token management (database-backed) ────────────────────

def generate_reset_token(db: Session) -> str:
    """Generate a secure random reset token and persist it with expiry."""
    now = datetime.now(timezone.utc)

    # Clean up expired/used tokens so the table doesn't grow forever
    db.query(PasswordResetToken).filter(
        (PasswordResetToken.expires_at < now) | (PasswordResetToken.used.is_(True))
    ).delete(synchronize_session=False)

    token = secrets.token_urlsafe(32)
    db.add(PasswordResetToken(
        token=token,
        expires_at=now + timedelta(minutes=TOKEN_EXPIRY_MINUTES),
        used=False,
    ))
    db.commit()
    return token


def validate_reset_token(db: Session, token: str) -> bool:
    """Returns True if the token exists, is unused, and has not expired."""
    entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).first()
    if not entry or entry.used:
        return False

    # Compare timezone-aware now with stored expiry (normalise if naive)
    expires = entry.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires >= datetime.now(timezone.utc)


def consume_reset_token(db: Session, token: str) -> None:
    """Mark the token used — single use only."""
    entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).first()
    if entry:
        entry.used = True
        db.commit()


# ── Password update (database-backed) ─────────────────────

def is_same_as_current(db: Session, new_password: str) -> bool:
    """True if new_password matches the current admin password."""
    current = get_password_hash(db)
    return bool(current) and verify_password(new_password, current)


def update_admin_password(db: Session, new_password: str) -> None:
    """Hash the new password and persist it to the database.

    The audit log entry (with IP) is written by the reset-password
    endpoint so the whole lifecycle is recorded in one place.
    """
    set_password_hash(db, hash_password(new_password))


# ── Email ─────────────────────────────────────────────────

def send_reset_email(token: str) -> bool:
    """
    Sends the password reset link to the configured ADMIN_RECOVERY_EMAIL.
    Returns True on success, False on failure.
    """
    if not RESEND_API_KEY:
        logger.warning(
            "Password reset email not sent — RESEND_API_KEY not configured",
            extra={"category": "admin", "action": "reset_email_skipped"},
        )
        return False

    if not ADMIN_RECOVERY_EMAIL:
        logger.warning(
            "Password reset email not sent — ADMIN_RECOVERY_EMAIL not configured",
            extra={"category": "admin", "action": "reset_email_skipped"},
        )
        return False

    reset_url = f"{FRONTEND_URL}/admin?reset_token={token}"

    html = f"""
    <div style="font-family: Arial, sans-serif; background: #FDFAF7; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #E8D8DC;">

        <div style="background: #3A2830; padding: 28px 40px; text-align: center;">
          <div style="font-family: Georgia, serif; font-style: italic; font-size: 20px; color: #FDFAF7;">
            Kut, Kolor <span style="color: #C4748A;">N B3yond</span>
          </div>
          <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(253,250,247,0.4); margin-top: 6px;">
            Admin Panel
          </div>
        </div>

        <div style="padding: 40px;">
          <h1 style="font-family: Georgia, serif; font-style: italic; font-size: 26px; color: #3A2830; margin: 0 0 16px; font-weight: 400;">
            Password Reset Request
          </h1>
          <p style="font-size: 14px; color: #7A5C64; line-height: 1.75; margin: 0 0 28px;">
            A password reset was requested for the KKB Admin Panel.
            Click the button below to set a new password.
            This link expires in <strong>{TOKEN_EXPIRY_MINUTES} minutes</strong>.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="{reset_url}"
               style="background: #3A2830; color: #FDFAF7; padding: 14px 40px;
                      text-decoration: none; font-family: Arial, sans-serif;
                      font-size: 12px; font-weight: 500; letter-spacing: 2px;
                      text-transform: uppercase; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 12px; color: #A08890; line-height: 1.7; margin: 0;">
            If you did not request a password reset, ignore this email.
            Your password will not change.
          </p>
        </div>

        <div style="background: #F9EEF0; padding: 20px 40px; border-top: 1px solid #E8D8DC; text-align: center;">
          <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C4748A; margin-bottom: 6px;">
            Link not working?
          </div>
          <div style="font-size: 11px; color: #A08890; word-break: break-all;">
            {reset_url}
          </div>
        </div>

      </div>
    </div>
    """

    try:
        import requests as http
        response = http.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type":  "application/json",
            },
            json={
                "from":    f"{SALON_NAME} Admin <{SALON_EMAIL_FROM}>",
                "to":      [ADMIN_RECOVERY_EMAIL],
                "subject": "Admin Password Reset — Kut, Kolor N B3yond",
                "html":    html,
            },
            timeout=10,
        )

        if response.status_code in (200, 201):
            logger.info(
                "Password reset email sent",
                extra={
                    "category": "admin",
                    "action":   "reset_email_sent",
                    "to":       ADMIN_RECOVERY_EMAIL,
                },
            )
            return True
        else:
            logger.warning(
                "Password reset email failed",
                extra={
                    "category":    "admin",
                    "action":      "reset_email_failed",
                    "status_code": response.status_code,
                },
            )
            return False

    except Exception as e:
        logger.error(
            f"Password reset email error: {str(e)}",
            extra={"category": "admin", "action": "reset_email_error"},
        )
        return False
