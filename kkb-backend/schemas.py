"""
schemas.py
----------
Pydantic models used for:
  - Validating incoming request bodies
  - Shaping outgoing API responses

Naming convention:
  <Model>Create  — what the client sends (POST body)
  <Model>Out     — what the API returns
  <Model>Update  — partial update payload (PATCH)
"""

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from models import BookingStatus, ContactStatus

# US phone — 10 digits after stripping formatting characters
US_PHONE_RE = re.compile(r"^\D*(\d\D*){10}$")


# ── Booking schemas ───────────────────────────────────────

class BookingCreate(BaseModel):
    full_name:      str
    email:          EmailStr
    phone:          str
    service:        str
    stylist:        Optional[str] = "Any available"
    preferred_date: str
    preferred_time: str
    notes:          Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be blank")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Phone number is required")
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError(
                "Please enter a valid 10-digit US phone number "
                "e.g. (555) 123-4567"
            )
        if re.search(r"[a-zA-Z]", v):
            raise ValueError("Phone number cannot contain letters")
        return v.strip()

    @field_validator("service")
    @classmethod
    def service_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Please select a service")
        return v.strip()

    @field_validator("preferred_date")
    @classmethod
    def date_valid(cls, v: str) -> str:
        from datetime import date
        v = v.strip()
        if not v:
            raise ValueError("Please select a preferred date")
        # Parse first — reject malformed dates instead of silently accepting them
        try:
            selected = date.fromisoformat(v)
        except ValueError:
            raise ValueError("Please enter a valid date in YYYY-MM-DD format")
        # Then reject past dates
        if selected < date.today():
            raise ValueError("Appointment date cannot be in the past")
        return v

    @field_validator("preferred_time")
    @classmethod
    def time_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Please select a preferred time")
        return v.strip()

    model_config = {"str_strip_whitespace": True}


class BookingOut(BaseModel):
    id:             int
    full_name:      str
    email:          str
    phone:          str
    service:        str
    stylist:        Optional[str]
    preferred_date: str
    preferred_time: str
    notes:          Optional[str]
    status:         BookingStatus
    created_at:     datetime

    model_config = {"from_attributes": True}


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


# ── Contact schemas ───────────────────────────────────────

class ContactCreate(BaseModel):
    name:    str
    email:   EmailStr
    message: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip()

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be blank")
        if len(v.strip()) < 10:
            raise ValueError("Message must be at least 10 characters")
        return v.strip()

    model_config = {"str_strip_whitespace": True}


class ContactOut(BaseModel):
    id:         int
    name:       str
    email:      str
    message:    str
    status:     ContactStatus
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Generic response ──────────────────────────────────────

class MessageResponse(BaseModel):
    """Simple success/info response."""
    message: str
