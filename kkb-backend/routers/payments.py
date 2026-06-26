"""
routers/payments.py
-------------------
Endpoints:
  POST /payments/setup-intent          — create SetupIntent before booking form loads
  POST /payments/save-card/{booking_id} — attach card to booking after customer submits
  POST /payments/charge-fee/{booking_id} — admin charges cancellation fee (requires auth)
  GET  /payments/booking/{booking_id}   — get payment status of a booking (requires auth)
"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Booking, BookingStatus, PaymentStatus
from auth import require_admin
from payment_service import (
    create_setup_intent,
    get_payment_method_details,
    attach_payment_method,
    charge_cancellation_fee,
)
from logger import get_logger

logger = get_logger("kkb.payments")

router = APIRouter(prefix="/payments", tags=["Payments"])

LATE_CANCEL_HOURS = 24  # window for "late cancellation"

# The salon operates in California. America/Los_Angeles tracks PST/PDT
# automatically (handles daylight saving), so appointment times — which are
# stored as naive local salon time — are interpreted correctly year round.
SALON_TZ = ZoneInfo("America/Los_Angeles")


# ── Schemas ───────────────────────────────────────────────

class SetupIntentRequest(BaseModel):
    email: str


class SaveCardRequest(BaseModel):
    payment_method_id: str
    customer_id:       str


class ChargeFeeRequest(BaseModel):
    amount:        float           # dollars e.g. 25.00
    reason:        str             # no_show | late_cancellation | cancellation
    waive:         bool = False    # True = admin chose to waive, just cancel


# ── Helpers ───────────────────────────────────────────────

def _is_late_cancellation(preferred_date: str, preferred_time: str) -> bool:
    """
    Returns True if the appointment is within LATE_CANCEL_HOURS from now,
    measured in the salon's local timezone (California / PST-PDT).
    preferred_date: YYYY-MM-DD, preferred_time: e.g. "10:00 AM"
    """
    try:
        appt_str  = f"{preferred_date} {preferred_time}"
        appt_dt   = datetime.strptime(appt_str, "%Y-%m-%d %I:%M %p")
        appt_dt   = appt_dt.replace(tzinfo=SALON_TZ)   # naive string is salon local time
        now       = datetime.now(SALON_TZ)
        diff_hrs  = (appt_dt - now).total_seconds() / 3600
        return 0 <= diff_hrs <= LATE_CANCEL_HOURS
    except Exception:
        return False


# ── POST /payments/setup-intent ───────────────────────────
@router.post(
    "/setup-intent",
    summary="Create a SetupIntent — call when booking form loads",
)
def setup_intent(payload: SetupIntentRequest):
    """
    Public endpoint — no auth required.
    Returns client_secret for Stripe Elements.
    No card is saved or charged at this point.
    """
    try:
        result = create_setup_intent(payload.email)
        logger.info(
            "SetupIntent created",
            extra={"category": "payment", "action": "setup_intent_created"},
        )
        return result
    except Exception as e:
        logger.error(
            "SetupIntent failed",
            extra={"category": "payment", "action": "setup_intent_failed", "reason": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service unavailable. Please try again.",
        )


# ── POST /payments/save-card/{booking_id} ─────────────────
@router.post(
    "/save-card/{booking_id}",
    summary="Save card to a booking after customer completes Stripe form",
)
def save_card(
    booking_id:       int,
    payload:          SaveCardRequest,
    db:               Session = Depends(get_db),
):
    """
    Called after the booking is created and the customer completes
    the Stripe card form. Attaches the PaymentMethod to the customer
    and saves card details to the booking record.
    Public — no auth required.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found")

    try:
        # Retrieve card details (last4, brand)
        card_details = get_payment_method_details(payload.payment_method_id)

        # Attach the card to the Stripe customer
        attach_payment_method(payload.payment_method_id, payload.customer_id)

        # Save to booking record
        booking.stripe_payment_method_id = payload.payment_method_id
        booking.stripe_customer_id       = payload.customer_id
        booking.card_last4               = card_details["card_last4"]
        booking.card_brand               = card_details["card_brand"]
        booking.payment_status           = PaymentStatus.card_saved
        db.commit()

        logger.info(
            "Card saved to booking",
            extra={
                "category":   "payment",
                "action":     "card_saved",
                "booking_id": booking_id,
                "card_brand": card_details["card_brand"],
                "card_last4": card_details["card_last4"],
            },
        )

        return {
            "message":    "Card saved successfully",
            "card_brand": card_details["card_brand"],
            "card_last4": card_details["card_last4"],
        }

    except Exception as e:
        logger.error(
            "Card save failed",
            extra={"category": "payment", "action": "card_save_failed",
                   "booking_id": booking_id, "reason": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not save card. Please try again.",
        )


# ── POST /payments/charge-fee/{booking_id} ────────────────
@router.post(
    "/charge-fee/{booking_id}",
    summary="Admin: cancel booking and optionally charge a fee",
)
def charge_fee(
    booking_id: int,
    payload:    ChargeFeeRequest,
    db:         Session       = Depends(get_db),
    admin:      dict          = Depends(require_admin),
):
    """
    Admin-only. Cancels the booking and either:
      - Waives the fee (payload.waive = True) — just cancels
      - Charges the fee (payload.waive = False) — charges card then cancels
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found")

    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    # ── Waive — just cancel, no charge ─────────────────────
    if payload.waive:
        booking.status         = BookingStatus.cancelled
        booking.payment_status = PaymentStatus.fee_waived
        db.commit()

        logger.info(
            "Booking cancelled — fee waived by admin",
            extra={
                "category":   "payment",
                "action":     "fee_waived",
                "booking_id": booking_id,
                "client":     booking.full_name,
            },
        )

        # Send cancellation email
        try:
            from email_service import send_booking_cancelled_email
            send_booking_cancelled_email(booking)
        except Exception:
            pass

        return {"message": "Booking cancelled. No fee charged.", "status": "waived"}

    # ── Charge fee ─────────────────────────────────────────
    if not booking.stripe_payment_method_id:
        raise HTTPException(
            status_code=400,
            detail="No card on file for this booking. Cannot charge a fee.",
        )

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Fee amount must be greater than zero")

    # Auto-detect late cancellation server-side (salon time) — the server is the
    # source of truth, not the client. Explicit admin judgments (no_show / other)
    # are respected; only the generic cancellation case is auto-classified.
    reason = payload.reason
    if reason in ("cancellation", "late_cancellation"):
        reason = "late_cancellation" if _is_late_cancellation(
            booking.preferred_date, booking.preferred_time
        ) else "cancellation"

    try:
        result = charge_cancellation_fee(
            booking=booking,
            amount_dollars=payload.amount,
            reason=reason,
        )

        # Update booking record
        booking.status          = BookingStatus.cancelled
        booking.payment_status  = PaymentStatus.fee_charged
        booking.fee_amount      = payload.amount
        booking.fee_charged_at  = datetime.now(timezone.utc)
        booking.charge_reason   = reason
        booking.stripe_charge_id = result["charge_id"]
        db.commit()

        # Send cancellation email
        try:
            from email_service import send_booking_cancelled_email, send_fee_charged_email
            send_booking_cancelled_email(booking)
            send_fee_charged_email(booking)
        except Exception:
            pass

        return {
            "message":      f"Fee of ${payload.amount:.2f} charged successfully",
            "charge_id":    result["charge_id"],
            "amount":       payload.amount,
            "status":       "charged",
        }

    except Exception as e:
        # Mark charge as failed but still allow admin to cancel the booking
        booking.payment_status = PaymentStatus.fee_failed
        db.commit()

        logger.error(
            "Cancellation fee charge failed",
            extra={"category": "payment", "action": "fee_charge_failed",
                   "booking_id": booking_id, "amount": payload.amount,
                   "reason": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Card charge failed: {str(e)}. Booking has not been cancelled.",
        )


# ── GET /payments/booking/{booking_id} ───────────────────
@router.get(
    "/booking/{booking_id}",
    summary="Get payment status of a booking (admin)",
)
def get_payment_status(
    booking_id: int,
    db:         Session = Depends(get_db),
    admin:      dict    = Depends(require_admin),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found")

    return {
        "booking_id":      booking_id,
        "payment_status":  booking.payment_status,
        "card_brand":      booking.card_brand,
        "card_last4":      booking.card_last4,
        "fee_amount":      float(booking.fee_amount) if booking.fee_amount else None,
        "fee_charged_at":  booking.fee_charged_at,
        "charge_reason":   booking.charge_reason,
        "stripe_charge_id": booking.stripe_charge_id,
    }
