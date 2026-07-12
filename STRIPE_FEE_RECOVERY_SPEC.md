# Cancellation-Fee Recovery & Stripe Webhooks — Spec

> **Status: NOT IMPLEMENTED. Design only.** Nothing here is wired into the app;
> the live flow is untouched. This is gated on the 🔴 critical item **"Stripe
> account not active / live keys not set"** and requires a deployed HTTPS URL —
> both prerequisites before this can be built or tested.

## Problem

Cancellation fees are charged **off-session** (customer not present). Those
charges can fail — most importantly with `authentication_required` (the bank
wants 3‑D Secure), but also soft declines / insufficient funds.

Today the app handles a failure gracefully (records `fee_failed`, keeps the card
on file, emails the client, doesn't cancel the booking) — but there is **no way
for the client to actually pay** a fee that failed off-session. This spec adds:

1. A **hosted recovery payment** the client can complete themselves (authenticate
   / pay the fee on a Stripe-hosted page).
2. A **webhook** so the result flows back into the app automatically (mark the
   booking `fee_charged`, send the receipt) — no manual admin step.

---

## Part 1 — Recovery payment (when an off-session charge fails)

When `charge_cancellation_fee` fails, create a hosted payment for the same fee
and email the client a link. Two viable approaches:

### Option A — Stripe Invoice (recommended)
Stripe emails a branded invoice with a hosted payment page and auto-issues a
receipt on payment. Least custom UI.

```python
item = stripe.InvoiceItem.create(
    customer=booking.stripe_customer_id,
    amount=int(round(amount_dollars * 100)),
    currency="usd",
    description=f"Cancellation fee — KKB-{booking.id:04d}",
)
invoice = stripe.Invoice.create(
    customer=booking.stripe_customer_id,
    collection_method="send_invoice",
    days_until_due=7,
    metadata={"booking_id": str(booking.id), "kind": "cancellation_fee"},
)
invoice = stripe.Invoice.finalize_invoice(invoice.id)
stripe.Invoice.send_invoice(invoice.id)
recovery_url = invoice.hosted_invoice_url
```

### Option B — Stripe Checkout Session
A one-off hosted checkout for the amount; we email the `session.url`.

```python
session = stripe.checkout.Session.create(
    mode="payment",
    customer=booking.stripe_customer_id,
    line_items=[{
        "price_data": {
            "currency": "usd",
            "product_data": {"name": f"Cancellation fee — KKB-{booking.id:04d}"},
            "unit_amount": int(round(amount_dollars * 100)),
        },
        "quantity": 1,
    }],
    success_url=f"{FRONTEND_URL}/fee-paid?b={booking.id}",
    cancel_url=f"{FRONTEND_URL}/",
    metadata={"booking_id": str(booking.id), "kind": "cancellation_fee"},
)
recovery_url = session.url
```

**Recommendation:** Option A (Invoice) — Stripe handles the email, hosted page,
3‑D Secure, and receipt. Store `recovery_url` on the booking and include it in
the existing `send_fee_failed_email`.

### Data model change
```sql
ALTER TABLE bookings ADD COLUMN fee_recovery_url        TEXT;
ALTER TABLE bookings ADD COLUMN fee_recovery_ref        VARCHAR(120);  -- invoice/session id
```
(Additive migration, same safe pattern as the consent columns.)

---

## Part 2 — Webhook endpoint (reconcile the result)

A public endpoint, secured by **Stripe signature verification** (not
`require_admin`). It must read the **raw** request body for the signature check.

```python
# routers/webhooks.py
@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()                    # RAW bytes — required
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    et = event["type"]
    obj = event["data"]["object"]
    booking_id = (obj.get("metadata") or {}).get("booking_id")

    if et in ("invoice.paid", "checkout.session.completed", "payment_intent.succeeded"):
        _mark_fee_paid(db, booking_id, obj)           # idempotent (see below)
    elif et in ("invoice.payment_failed", "payment_intent.payment_failed"):
        _log_fee_failed(db, booking_id, obj)

    return {"received": True}                          # always 200 for handled events
```

`_mark_fee_paid`: look up the booking, and **only if not already charged**, set
`payment_status=fee_charged`, `fee_charged_at`, `stripe_charge_id`, ensure
`status=cancelled`, clear `fee_recovery_url`, and send `send_fee_charged_email`.

### Idempotency (critical)
Stripe retries webhooks and may send duplicates. Guard every handler:
- Skip if the booking is already `fee_charged` with the same charge id.
- Optionally persist processed `event["id"]`s in a small `webhook_events` table
  and no-op on repeats.

### Security
- **Signature verification is the auth** — reject anything that doesn't verify.
- Endpoint is public but must be **HTTPS** (Render provides it).
- Add `/webhooks` to the request-logging middleware's skip list only if noisy;
  otherwise log normally. It must **not** be behind `require_admin`.
- Handle only known event types; ignore the rest.

### Config
```
STRIPE_WEBHOOK_SECRET=whsec_...      # from the Stripe dashboard webhook
```
Add to `.env.example` and `render.yaml` (as `sync: false`). Register the
endpoint `https://<backend>/webhooks/stripe` in the Stripe dashboard and
subscribe to: `invoice.paid`, `invoice.payment_failed`,
`checkout.session.completed`, `payment_intent.succeeded`,
`payment_intent.payment_failed`.

---

## Flow

```
Off-session charge fails (authentication_required / decline)
        │
        ├─ record fee_failed  (already implemented)
        ├─ create Stripe Invoice/Checkout for the fee  → recovery_url
        └─ email client the recovery link (extend send_fee_failed_email)
                 │
                 ▼   client opens link, authenticates & pays on Stripe
        Stripe → POST /webhooks/stripe (signed)
                 │  verify signature → invoice.paid
                 ▼
        mark booking fee_charged + cancelled, store charge id,
        send fee-charged receipt   (idempotent)
```

---

## Testing (Stripe test mode)
- `stripe listen --forward-to localhost:8000/webhooks/stripe` (Stripe CLI) to
  get a local `whsec_` and forward events.
- Trigger a 3‑D Secure decline off-session with test card `4000 0025 0000 3155`
  (requires authentication) to exercise the recovery path.
- `stripe trigger invoice.paid` to test reconciliation.
- Verify idempotency by replaying the same event twice.

## Edge cases
- **Client pays after admin already resolved it** → idempotency guard no-ops.
- **Recovery link expires** (invoice `days_until_due`) → admin can re-issue.
- **Refunds** → use the stored `stripe_charge_id` with `stripe.Refund.create`.
- **Partial/failed recovery** → stays `fee_failed`; visible in the admin
  "Fee Failed" filter (already implemented).

## Prerequisites & rollout
1. 🔴 Activate the Stripe account + set **live keys** (blocking).
2. Deploy backend to an HTTPS URL (Render).
3. Add `STRIPE_WEBHOOK_SECRET`; register the webhook in Stripe.
4. Build: recovery-payment creation → webhook endpoint → idempotent reconcile →
   extend the failure email with the link.
5. Test end-to-end with the Stripe CLI before enabling in production.
