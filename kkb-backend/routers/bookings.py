"""
routers/bookings.py
-------------------
Endpoints:
  POST   /bookings/                  — submit a new booking (with conflict check)
  GET    /bookings/                  — list all bookings (admin)
  GET    /bookings/availability      — check if a slot is available
  GET    /bookings/{id}              — get a single booking
  PATCH  /bookings/{id}              — update booking status (admin)
  DELETE /bookings/{id}              — delete a booking (admin)

Conflict rules:
  - Only bookings with status 'pending' or 'confirmed' block a slot
  - 'cancelled' and 'completed' bookings do NOT block a slot
  - If stylist is 'Any available', the slot is blocked only if ALL
    named stylists are taken at that date/time
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional

from database import get_db
from auth import require_admin, client_ip
from models import Booking, BookingStatus
from schemas import BookingCreate, BookingOut, BookingStatusUpdate, MessageResponse
from logger import (
    log_booking_created, log_booking_conflict,
    log_booking_status_changed, log_booking_edited,
    log_booking_deleted, log_error,
)

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"],
)

# Statuses that actively hold a slot — cancelled/completed free it up
ACTIVE_STATUSES = [BookingStatus.pending, BookingStatus.confirmed]

# All named stylists — used when checking "Any available"
ALL_STYLISTS = [
    "Samina Aleem",
]


# ── Conflict check helper ─────────────────────────────────
def get_conflicts(
    db:     Session,
    date:   str,
    time:   str,
    stylist: str,
) -> list:
    """
    Returns a list of conflicting bookings for a given date/time slot.

    Capacity model:
      The salon has a fixed number of chairs (= len(ALL_STYLISTS)). Every
      active booking occupies one chair — whether it names a specific
      stylist or was left as 'Any available'. A new booking can only be
      taken if a chair is free.

    Logic:
      - Specific stylist requested → conflict if that stylist is already
        personally booked at this slot, OR if every chair is already taken
        (so no one — including her — is free).
      - 'Any available' → conflict only if every chair is already taken.

    This counts 'Any available' bookings too, so two same-slot bookings can
    never both succeed once capacity is reached.
    """
    capacity = max(1, len(ALL_STYLISTS))

    active = db.query(Booking).filter(
        and_(
            Booking.preferred_date == date,
            Booking.preferred_time == time,
            Booking.status.in_(ACTIVE_STATUSES),
        )
    ).all()

    wants_specific = bool(stylist) and stylist.strip() not in ("Any available", "")

    if wants_specific:
        # That named stylist already taken at this slot?
        same_stylist = [b for b in active if b.stylist == stylist]
        if same_stylist:
            return same_stylist

    # Every chair already occupied → no one free
    if len(active) >= capacity:
        return active

    return []


# ── GET /bookings/availability ────────────────────────────
@router.get(
    "/availability",
    summary="Check if a date/time/stylist slot is available",
)
def check_availability(
    date:    str           = Query(..., description="YYYY-MM-DD"),
    time:    str           = Query(..., description="e.g. 9:00 AM"),
    stylist: Optional[str] = Query(None, description="Stylist name or 'Any available'"),
    db:      Session       = Depends(get_db),
):
    """
    Returns whether the requested slot is available.

    Response:
      { available: true }   — slot is free, booking can proceed
      { available: false, reason: "..." }  — slot is taken
    """
    if not date or not time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Both 'date' and 'time' are required.",
        )

    conflicts = get_conflicts(db, date, time, stylist or "Any available")

    if conflicts:
        stylist_label = stylist if stylist and stylist not in ("Any available", "") \
                        else "all stylists"
        return {
            "available": False,
            "reason": (
                f"Sorry, {stylist_label} is already booked on {date} at {time}. "
                f"Please choose a different time or stylist."
            ),
        }

    return {"available": True}


# ── POST /bookings/ ───────────────────────────────────────
@router.post(
    "/",
    response_model=BookingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new booking request",
)
def create_booking(payload: BookingCreate, request: Request, db: Session = Depends(get_db)):
    """
    Accepts a booking form submission.
    Runs a conflict check before saving — returns 409 if the slot is taken.
    Requires the client to have agreed to the Terms / Cancellation Policy;
    that consent is recorded on the booking (flag, timestamp, IP).
    """
    # Consent is mandatory — never trust the client UI alone
    if not payload.agreed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must agree to the Terms and Cancellation Policy to book.",
        )

    # Server-side conflict check (source of truth — never trust client alone)
    conflicts = get_conflicts(
        db,
        payload.preferred_date,
        payload.preferred_time,
        payload.stylist or "Any available",
    )

    if conflicts:
        log_booking_conflict(payload.preferred_date, payload.preferred_time, payload.stylist or "Any available")
        stylist_label = payload.stylist \
            if payload.stylist and payload.stylist not in ("Any available", "") \
            else "all stylists"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Sorry, {stylist_label} is already booked on "
                f"{payload.preferred_date} at {payload.preferred_time}. "
                f"Please choose a different time or stylist."
            ),
        )

    # Build the booking, recording consent (the `agreed` field isn't a column)
    data = payload.model_dump()
    data.pop("agreed", None)
    booking = Booking(
        **data,
        consent_agreed=True,
        consent_at=datetime.now(timezone.utc),
        consent_ip=client_ip(request),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    log_booking_created(booking)

    # Send "we received your request" email — never let an email failure
    # break the booking flow.
    try:
        from email_service import send_booking_received_email
        send_booking_received_email(booking)
    except Exception:
        pass

    return booking


# ── GET /bookings/ ────────────────────────────────────────
@router.get(
    "/",
    response_model=List[BookingOut],
    summary="List all bookings (admin)",
)
def list_bookings(
    skip:   int                     = 0,
    limit:  int                     = 50,
    status: Optional[BookingStatus] = None,
    db:     Session                 = Depends(get_db),
    admin:  dict                    = Depends(require_admin),
):
    """
    Returns a paginated list of all bookings.
    Optionally filter by status: pending | confirmed | cancelled | completed
    """
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    return query.order_by(Booking.preferred_date.asc(), Booking.preferred_time.asc()).offset(skip).limit(limit).all()


# ── GET /bookings/{id} ────────────────────────────────────
@router.get(
    "/{booking_id}",
    response_model=BookingOut,
    summary="Get a single booking by ID",
)
def get_booking(
    booking_id: int,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(require_admin),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found",
        )
    return booking


# ── PATCH /bookings/{id} ──────────────────────────────────
@router.patch(
    "/{booking_id}",
    response_model=BookingOut,
    summary="Update booking status (admin)",
)
def update_booking_status(
    booking_id: int,
    payload:    BookingStatusUpdate,
    db:         Session = Depends(get_db),
    admin:      dict    = Depends(require_admin),
):
    """
    Allows an admin to update a booking's status.
    e.g. pending → confirmed, confirmed → completed
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found",
        )
    old_status = booking.status.value
    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    log_booking_status_changed(booking_id, old_status, payload.status.value)

    # Email the client when an admin confirms their appointment.
    if payload.status == BookingStatus.confirmed and old_status != "confirmed":
        try:
            from email_service import send_booking_confirmed_email
            send_booking_confirmed_email(booking)
        except Exception:
            pass

    return booking



# ── PUT /bookings/{id}/admin ──────────────────────────────
@router.put(
    "/{booking_id}/admin",
    response_model=BookingOut,
    summary="Admin override — update all booking fields, no conflict check",
)
def admin_update_booking(
    booking_id: int,
    payload:    BookingCreate,
    db:         Session = Depends(get_db),
    admin:      dict    = Depends(require_admin),
):
    """
    Admin-only full update of a booking.
    Bypasses conflict detection entirely — admin can place any booking
    in any slot regardless of existing bookings.
    All fields can be changed: client info, service, stylist, date, time.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found",
        )

    # Update every field directly — no conflict check
    changes = payload.model_dump()
    changes.pop("agreed", None)  # not a column; only used at public booking time
    for field, value in changes.items():
        setattr(booking, field, value)

    # Editing a cancelled booking reactivates it — put it back in the queue
    # as pending so it shows up as a live appointment again.
    if booking.status == BookingStatus.cancelled:
        booking.status = BookingStatus.pending
        changes["status"] = "reactivated → pending"

    db.commit()
    db.refresh(booking)
    log_booking_edited(booking_id, changes)
    return booking


# ── DELETE /bookings/{id} ─────────────────────────────────
@router.delete(
    "/{booking_id}",
    response_model=MessageResponse,
    summary="Delete a booking (admin)",
)
def delete_booking(
    booking_id: int,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(require_admin),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found",
        )
    client = booking.full_name
    db.delete(booking)
    db.commit()
    log_booking_deleted(booking_id, client)
    return {"message": f"Booking {booking_id} deleted successfully"}
