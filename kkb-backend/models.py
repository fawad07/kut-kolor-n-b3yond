"""
models.py
---------
SQLAlchemy ORM models — one class per database table.

Tables created:
  bookings        — appointment requests from the booking form
  contact_messages — messages from the contact form
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text,
    DateTime, Enum as SAEnum, Boolean, Numeric,
)
import enum
from database import Base


# ── Enums ─────────────────────────────────────────────────

class BookingStatus(str, enum.Enum):
    pending   = "pending"    # just submitted, not yet reviewed
    confirmed = "confirmed"  # salon confirmed the appointment
    cancelled = "cancelled"  # cancelled by client or salon
    completed = "completed"  # appointment took place


class PaymentStatus(str, enum.Enum):
    none        = "none"         # no card saved
    card_saved  = "card_saved"   # card on file, not charged
    fee_charged = "fee_charged"  # cancellation fee charged
    fee_failed  = "fee_failed"   # charge attempt failed
    fee_waived  = "fee_waived"   # admin chose to waive the fee


class ContactStatus(str, enum.Enum):
    unread  = "unread"
    read    = "read"
    replied = "replied"


# ── Models ────────────────────────────────────────────────

class Booking(Base):
    """
    Stores every appointment request submitted through the booking form.
    """
    __tablename__ = "bookings"

    id              = Column(Integer, primary_key=True, index=True)

    # Client info
    full_name       = Column(String(120), nullable=False)
    email           = Column(String(255), nullable=False, index=True)
    phone           = Column(String(30),  nullable=False)

    # Appointment details
    service         = Column(String(120), nullable=False)
    stylist         = Column(String(120), nullable=True,  default="Any available")
    preferred_date  = Column(String(20),  nullable=False)
    preferred_time  = Column(String(20),  nullable=False)
    notes           = Column(Text,        nullable=True)

    # Status tracking
    status          = Column(
                        SAEnum(BookingStatus),
                        nullable=False,
                        default=BookingStatus.pending,
                        index=True,
                      )

    # ── Payment / card on file ─────────────────────────────
    stripe_customer_id       = Column(String(120), nullable=True)   # cus_xxxxx
    stripe_payment_method_id = Column(String(120), nullable=True)   # pm_xxxxx
    card_last4               = Column(String(4),   nullable=True)   # last 4 digits
    card_brand               = Column(String(20),  nullable=True)   # Visa, Mastercard etc.
    payment_status           = Column(
                                 SAEnum(PaymentStatus),
                                 nullable=False,
                                 default=PaymentStatus.none,
                               )
    fee_amount               = Column(Numeric(8, 2), nullable=True)  # amount charged
    fee_charged_at           = Column(DateTime(timezone=True), nullable=True)
    charge_reason            = Column(String(50), nullable=True)     # no_show | late_cancellation | other
    stripe_charge_id         = Column(String(120), nullable=True)    # pi_xxxxx — for refund reference

    # Timestamps
    created_at      = Column(
                        DateTime(timezone=True),
                        nullable=False,
                        default=lambda: datetime.now(timezone.utc),
                      )
    updated_at      = Column(
                        DateTime(timezone=True),
                        nullable=False,
                        default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc),
                      )

    def __repr__(self):
        return (
            f"<Booking id={self.id} name={self.full_name!r} "
            f"service={self.service!r} date={self.preferred_date} "
            f"status={self.status} payment={self.payment_status}>"
        )


class ContactMessage(Base):
    """
    Stores every message submitted through the contact form.
    """
    __tablename__ = "contact_messages"

    id          = Column(Integer, primary_key=True, index=True)

    name        = Column(String(120), nullable=False)
    email       = Column(String(255), nullable=False, index=True)
    message     = Column(Text,        nullable=False)

    status      = Column(
                    SAEnum(ContactStatus),
                    nullable=False,
                    default=ContactStatus.unread,
                    index=True,
                  )

    created_at  = Column(
                    DateTime(timezone=True),
                    nullable=False,
                    default=lambda: datetime.now(timezone.utc),
                  )

    def __repr__(self):
        return (
            f"<ContactMessage id={self.id} name={self.name!r} "
            f"email={self.email!r} status={self.status}>"
        )


class AdminSetting(Base):
    """
    Single-row table holding the admin password hash.

    Stored in the database (not the .env file) so a password reset
    survives server restarts and redeploys on cloud hosts where the
    filesystem is ephemeral. Bootstrapped once from ADMIN_PASSWORD_HASH.
    """
    __tablename__ = "admin_settings"

    id            = Column(Integer, primary_key=True)
    password_hash = Column(String(255), nullable=False)
    updated_at    = Column(
                      DateTime(timezone=True),
                      nullable=False,
                      default=lambda: datetime.now(timezone.utc),
                      onupdate=lambda: datetime.now(timezone.utc),
                    )


class PasswordResetToken(Base):
    """
    One-time password-reset tokens, persisted so they remain valid
    across restarts and shared across worker processes.
    """
    __tablename__ = "password_reset_tokens"

    token      = Column(String(128), primary_key=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, nullable=False, default=False)
    created_at = Column(
                   DateTime(timezone=True),
                   nullable=False,
                   default=lambda: datetime.now(timezone.utc),
                 )
