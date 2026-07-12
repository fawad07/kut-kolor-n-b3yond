"""
payment_service.py
------------------
Handles all Stripe interactions for the KKB card-on-file system.

Flow:
  1. Customer reaches booking form
     → POST /payments/setup-intent returns a client_secret
     → Frontend shows Stripe card element
     → Customer enters card (no charge)

  2. Customer submits booking
     → stripe_payment_method_id sent with booking data
     → Backend attaches card to a Stripe Customer
     → card_last4, card_brand, stripe_customer_id saved to booking

  3. Admin cancels booking and chooses to charge
     → POST /payments/charge-fee with booking_id and amount
     → Backend charges the saved PaymentMethod
     → fee_amount, fee_charged_at, charge_reason saved to booking

Setup:
  Add to .env:
    STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx   (test key for development)
    STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx   (live key for production)
    STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxx (sent to frontend)
"""

import os
import stripe
from dotenv import load_dotenv
from logger import get_logger

load_dotenv()

logger = get_logger("kkb.payment")

STRIPE_SECRET_KEY      = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


def _check_config():
    if not STRIPE_SECRET_KEY:
        raise RuntimeError(
            "STRIPE_SECRET_KEY not set in .env. "
            "Get your keys from https://dashboard.stripe.com/apikeys"
        )


# ── SetupIntent — create before showing card form ─────────

def create_setup_intent(email: str) -> dict:
    """
    Creates a Stripe SetupIntent and a Customer (if not exists).
    Returns the client_secret for the frontend Stripe Elements form.
    Called when the booking form loads.
    """
    _check_config()
    try:
        # Find or create a Stripe Customer for this email
        existing = stripe.Customer.search(query=f'email:"{email}"', limit=1)
        if existing.data:
            customer = existing.data[0]
        else:
            customer = stripe.Customer.create(email=email)

        # Create a SetupIntent — no charge, just saves the card
        intent = stripe.SetupIntent.create(
            customer=customer.id,
            payment_method_types=["card"],
            usage="off_session",  # allows future charges without customer present
            metadata={"email": email},
        )

        logger.info(
            "SetupIntent created",
            extra={
                "category": "payment",
                "action":   "setup_intent_created",
                "email":    email,
                "customer": customer.id,
            },
        )

        return {
            "client_secret":  intent.client_secret,
            "customer_id":    customer.id,
            "publishable_key": STRIPE_PUBLISHABLE_KEY,
        }

    except stripe.StripeError as e:
        logger.error(
            f"Stripe SetupIntent error: {str(e)}",
            extra={"category": "payment", "action": "setup_intent_error", "email": email},
        )
        raise


# ── Retrieve card details after customer completes form ───

def get_payment_method_details(payment_method_id: str) -> dict:
    """
    Retrieves card brand and last4 from a PaymentMethod ID.
    Called after the customer submits the card form.
    """
    _check_config()
    try:
        pm = stripe.PaymentMethod.retrieve(payment_method_id)
        return {
            "card_brand": pm.card.brand.capitalize(),  # visa → Visa
            "card_last4": pm.card.last4,
        }
    except stripe.StripeError as e:
        logger.error(
            f"Stripe PaymentMethod retrieve error: {str(e)}",
            extra={"category": "payment", "action": "retrieve_pm_error"},
        )
        raise


# ── Attach card to customer ───────────────────────────────

def attach_payment_method(payment_method_id: str, customer_id: str) -> None:
    """Attaches a PaymentMethod to a Stripe Customer for future charges."""
    _check_config()
    try:
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id,
        )
        # Set as default payment method
        stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )
    except stripe.StripeError as e:
        logger.error(
            f"Stripe attach PaymentMethod error: {str(e)}",
            extra={"category": "payment", "action": "attach_pm_error"},
        )
        raise


# ── Charge the saved card (admin action) ─────────────────

def charge_cancellation_fee(
    booking,
    amount_dollars: float,
    reason: str = "cancellation",
    idempotency_key: str = None,
) -> dict:
    """
    Charges the saved card on file for a cancellation fee.
    Called by the admin when cancelling a booking with a fee.

    Args:
        booking:        The Booking ORM object with stripe fields populated
        amount_dollars: Fee amount in dollars (e.g. 25.00)
        reason:         "no_show" | "late_cancellation" | "cancellation"

    Returns:
        dict with charge_id and amount_charged
    """
    _check_config()

    if not booking.stripe_payment_method_id:
        raise ValueError("No card on file for this booking")

    if not booking.stripe_customer_id:
        raise ValueError("No Stripe customer ID for this booking")

    amount_cents = int(round(amount_dollars * 100))

    # Stripe idempotency — a repeated request with the same key (e.g. an admin
    # double-submit) is de-duplicated by Stripe and never charges twice.
    extra_opts = {"idempotency_key": idempotency_key} if idempotency_key else {}

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            customer=booking.stripe_customer_id,
            payment_method=booking.stripe_payment_method_id,
            confirmation_method="automatic",
            confirm=True,
            off_session=True,   # charge without customer present
            **extra_opts,
            description=(
                f"KKB Cancellation Fee — {reason.replace('_', ' ').title()} "
                f"— Booking KKB-{str(booking.id).zfill(4)} "
                f"— {booking.full_name}"
            ),
            metadata={
                "booking_id":  str(booking.id),
                "client_name": booking.full_name,
                "client_email": booking.email,
                "reason":      reason,
                "service":     booking.service,
                "date":        booking.preferred_date,
            },
        )

        logger.info(
            "Cancellation fee charged",
            extra={
                "category":    "payment",
                "action":      "fee_charged",
                "booking_id":  booking.id,
                "client":      booking.full_name,
                "amount":      amount_dollars,
                "reason":      reason,
                "charge_id":   intent.id,
            },
        )

        return {
            "charge_id":      intent.id,
            "amount_charged": amount_dollars,
            "status":         intent.status,
        }

    except stripe.CardError as e:
        logger.warning(
            f"Card declined charging fee: {str(e)}",
            extra={
                "category":   "payment",
                "action":     "fee_charge_declined",
                "booking_id": booking.id,
                "amount":     amount_dollars,
            },
        )
        raise
    except stripe.StripeError as e:
        logger.error(
            f"Stripe charge error: {str(e)}",
            extra={
                "category":   "payment",
                "action":     "fee_charge_error",
                "booking_id": booking.id,
            },
        )
        raise
