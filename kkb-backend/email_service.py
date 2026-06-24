"""
email_service.py
-----------------
Sends transactional emails via Resend.

Triggers:
  - Booking received (status: pending)
  - Booking confirmed (status: confirmed)
  - Booking cancelled (status: cancelled)

Setup:
  1. Create a free account at https://resend.com
  2. Get your API key from the dashboard
  3. Add to .env:
       RESEND_API_KEY=re_xxxxxxxxxxxx
       SALON_EMAIL_FROM=onboarding@resend.dev
       SALON_NAME=Kut, Kolor N B3yond
       SALON_PHONE=(555) 123-4567

Note: with the free Resend tier and the default `onboarding@resend.dev`
sender, emails can only be sent to the email address you signed up with
in Resend (sandbox mode). To send to any customer email, verify your own
domain in the Resend dashboard and update SALON_EMAIL_FROM accordingly.
"""

import os
import requests
from dotenv import load_dotenv
from logger import get_logger

load_dotenv()

logger = get_logger("kkb.email")

RESEND_API_KEY   = os.getenv("RESEND_API_KEY")
SALON_EMAIL_FROM = os.getenv("SALON_EMAIL_FROM", "onboarding@resend.dev")
SALON_NAME       = os.getenv("SALON_NAME", "Kut, Kolor N B3yond")
SALON_PHONE      = os.getenv("SALON_PHONE", "(555) 123-4567")

RESEND_URL = "https://api.resend.com/emails"

# ── Brand colours for email HTML ──────────────────────────
ROSE  = "#C4748A"
DARK  = "#3A2830"
CREAM = "#FDFAF7"
BLUSH = "#F9EEF0"
WARM  = "#7A5C64"


def _send(to_email: str, subject: str, html: str) -> bool:
    """
    Low-level send via Resend API.
    Returns True on success, False on failure. Never raises —
    email failures should not break the booking flow.
    """
    if not RESEND_API_KEY:
        logger.warning(
            "Email not sent — RESEND_API_KEY not configured",
            extra={"category": "email", "action": "skipped", "to": to_email, "subject": subject},
        )
        return False

    try:
        response = requests.post(
            RESEND_URL,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type":  "application/json",
            },
            json={
                "from":    f"{SALON_NAME} <{SALON_EMAIL_FROM}>",
                "to":      [to_email],
                "subject": subject,
                "html":    html,
            },
            timeout=10,
        )

        if response.status_code in (200, 201):
            logger.info(
                "Email sent successfully",
                extra={"category": "email", "action": "sent", "to": to_email, "subject": subject},
            )
            return True
        else:
            logger.warning(
                "Email failed to send",
                extra={
                    "category": "email", "action": "failed",
                    "to": to_email, "subject": subject,
                    "status_code": response.status_code,
                    "response": response.text[:500],
                },
            )
            return False

    except Exception as e:
        logger.error(
            f"Email send error: {str(e)}",
            extra={"category": "email", "action": "error", "to": to_email, "subject": subject},
            exc_info=True,
        )
        return False


# ── Shared email layout ────────────────────────────────────
def _wrap_email(title: str, accent: str, body_html: str) -> str:
    """Wraps content in a consistent branded email template."""
    return f"""
    <div style="font-family: Georgia, serif; background-color: {CREAM}; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #E8D8DC;">

        <div style="background: {DARK}; padding: 32px 40px; text-align: center;">
          <div style="font-family: Georgia, serif; font-style: italic; font-size: 22px; color: {CREAM}; letter-spacing: 0.5px;">
            Kut, Kolor <span style="color: {accent};">N B3yond</span>
          </div>
        </div>

        <div style="padding: 40px;">
          <h1 style="font-family: Georgia, serif; font-style: italic; font-size: 28px; color: {DARK}; margin: 0 0 16px 0; font-weight: 400;">
            {title}
          </h1>
          {body_html}
        </div>

        <div style="background: {BLUSH}; padding: 24px 40px; text-align: center; border-top: 1px solid #E8D8DC;">
          <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: {accent}; margin-bottom: 6px; font-family: Arial, sans-serif;">
            Questions?
          </div>
          <div style="font-size: 18px; color: {DARK}; font-family: Georgia, serif;">
            {SALON_PHONE}
          </div>
        </div>

      </div>
    </div>
    """


def _details_table(booking) -> str:
    """Renders booking details as an HTML table."""
    rows = [
        ("Reference",  f"KKB-{str(booking.id).zfill(4)}"),
        ("Service",    booking.service),
        ("Stylist",    booking.stylist or "Any available"),
        ("Date",       booking.preferred_date),
        ("Time",       booking.preferred_time),
    ]
    cells = ""
    for label, value in rows:
        cells += f"""
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F2E8EC; font-size: 13px; color: {WARM}; font-family: Arial, sans-serif;">{label}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F2E8EC; font-size: 14px; color: {DARK}; font-weight: 600; text-align: right; font-family: Arial, sans-serif;">{value}</td>
        </tr>
        """
    return f"""
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: {BLUSH}; padding: 4px 16px;">
      {cells}
    </table>
    """


# ── Public functions — one per trigger ─────────────────────

def send_booking_received_email(booking) -> bool:
    """Sent immediately when a customer submits a booking (status: pending)."""
    body_html = f"""
      <p style="font-size: 15px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        Hi {booking.full_name},<br/><br/>
        Thanks for booking with us! We've received your appointment request
        and will confirm it shortly — usually within a few hours.
      </p>
      {_details_table(booking)}
      <p style="font-size: 13px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        You'll receive another email as soon as your appointment is confirmed.
        If you need to make any changes, just give us a call.
      </p>
    """
    return _send(
        to_email=booking.email,
        subject=f"Booking Received — KKB-{str(booking.id).zfill(4)}",
        html=_wrap_email("Booking Received", ROSE, body_html),
    )


def send_booking_confirmed_email(booking) -> bool:
    """Sent when admin changes status to confirmed."""
    body_html = f"""
      <p style="font-size: 15px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        Hi {booking.full_name},<br/><br/>
        Great news — your appointment is <strong style="color:{DARK};">confirmed</strong>!
        We look forward to seeing you.
      </p>
      {_details_table(booking)}
      <p style="font-size: 13px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        Please arrive a few minutes early. If anything comes up and you need
        to reschedule, just give us a call.
      </p>
    """
    return _send(
        to_email=booking.email,
        subject=f"Your Appointment is Confirmed — KKB-{str(booking.id).zfill(4)}",
        html=_wrap_email("Appointment Confirmed", ROSE, body_html),
    )


def send_booking_cancelled_email(booking) -> bool:
    """Sent when admin (or system) changes status to cancelled."""
    body_html = f"""
      <p style="font-size: 15px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        Hi {booking.full_name},<br/><br/>
        This is to confirm that your appointment below has been
        <strong style="color:{DARK};">cancelled</strong>.
      </p>
      {_details_table(booking)}
      <p style="font-size: 13px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        If this was a mistake or you'd like to rebook, please give us a call
        or visit our website to book a new appointment.
      </p>
    """
    return _send(
        to_email=booking.email,
        subject=f"Appointment Cancelled — KKB-{str(booking.id).zfill(4)}",
        html=_wrap_email("Appointment Cancelled", ROSE, body_html),
    )


def send_fee_charged_email(booking) -> bool:
    """Sent when admin charges a cancellation fee."""
    amount = f"${float(booking.fee_amount):.2f}" if booking.fee_amount else "a fee"
    reason_label = {
        "no_show":           "no-show",
        "late_cancellation": "late cancellation (within 24 hours)",
        "cancellation":      "cancellation",
    }.get(booking.charge_reason or "cancellation", "cancellation")

    body_html = f"""
      <p style="font-size: 15px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        Hi {booking.full_name},<br/><br/>
        A cancellation fee of <strong style="color:{DARK};">{amount}</strong> has been
        charged to your {booking.card_brand} card ending in {booking.card_last4}
        due to a <strong style="color:{DARK};">{reason_label}</strong> on your appointment below.
      </p>
      {_details_table(booking)}
      <p style="font-size: 13px; color: {WARM}; line-height: 1.7; font-family: Arial, sans-serif;">
        If you have any questions about this charge, please don't hesitate to give us a call.
        We hope to see you again soon.
      </p>
    """
    return _send(
        to_email=booking.email,
        subject=f"Cancellation Fee Charged — KKB-{str(booking.id).zfill(4)}",
        html=_wrap_email("Cancellation Fee", ROSE, body_html),
    )
