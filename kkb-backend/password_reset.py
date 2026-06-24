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
import re as regex
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from auth import hash_password, pwd_context
from logger import get_admin_logger

load_dotenv()

logger = get_admin_logger()

RESEND_API_KEY       = os.getenv("RESEND_API_KEY", "")
SALON_EMAIL_FROM     = os.getenv("SALON_EMAIL_FROM", "onboarding@resend.dev")
SALON_NAME           = os.getenv("SALON_NAME", "Kut, Kolor N B3yond")
ADMIN_RECOVERY_EMAIL = os.getenv("ADMIN_RECOVERY_EMAIL", "")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:5173")

# In-memory token store: { token: { expires_at: datetime } }
_reset_tokens: dict = {}

TOKEN_EXPIRY_MINUTES = 15
ENV_FILE_PATH = os.path.join(os.path.dirname(__file__), ".env")


# ── Token management ──────────────────────────────────────

def generate_reset_token() -> str:
    """Generate a secure random reset token and store it with expiry."""
    # Clean up expired tokens first
    now = datetime.now(timezone.utc)
    expired = [t for t, v in _reset_tokens.items() if v["expires_at"] < now]
    for t in expired:
        del _reset_tokens[t]

    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        "expires_at": now + timedelta(minutes=TOKEN_EXPIRY_MINUTES),
    }
    return token


def validate_reset_token(token: str) -> bool:
    """Returns True if the token exists and has not expired."""
    entry = _reset_tokens.get(token)
    if not entry:
        return False
    if entry["expires_at"] < datetime.now(timezone.utc):
        del _reset_tokens[token]
        return False
    return True


def consume_reset_token(token: str) -> None:
    """Delete the token after use — single use only."""
    _reset_tokens.pop(token, None)


# ── .env update ───────────────────────────────────────────

def update_env_password(new_password: str) -> None:
    """
    Hashes the new password and writes the updated hash back to .env.
    Replaces the ADMIN_PASSWORD_HASH line in place.
    All other .env values are preserved.
    """
    new_hash = hash_password(new_password)

    # Read current .env
    if not os.path.exists(ENV_FILE_PATH):
        raise FileNotFoundError(f".env file not found at {ENV_FILE_PATH}")

    with open(ENV_FILE_PATH, "r") as f:
        content = f.read()

    # Replace or append ADMIN_PASSWORD_HASH
    if "ADMIN_PASSWORD_HASH=" in content:
        content = regex.sub(
            r"^ADMIN_PASSWORD_HASH=.*$",
            f"ADMIN_PASSWORD_HASH={new_hash}",
            content,
            flags=regex.MULTILINE,
        )
    else:
        content += f"\nADMIN_PASSWORD_HASH={new_hash}\n"

    with open(ENV_FILE_PATH, "w") as f:
        f.write(content)

    # Reload the env so the running process picks up the new hash
    load_dotenv(override=True)

    # Update auth module's in-process value immediately
    import auth as auth_module
    auth_module.ADMIN_PASSWORD_HASH = new_hash

    logger.info(
        "Admin password reset successfully",
        extra={"category": "admin", "action": "password_reset"},
    )


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
