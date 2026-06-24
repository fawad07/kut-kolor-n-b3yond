"""
routers/contact.py
------------------
Endpoints:
  POST   /contact           — submit a contact message
  GET    /contact           — list all messages (admin use)
  GET    /contact/{id}      — get a single message
  PATCH  /contact/{id}      — mark as read / replied (admin use)
  DELETE /contact/{id}      — delete a message (admin use)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from auth import require_admin
from models import ContactMessage, ContactStatus
from schemas import ContactCreate, ContactOut, MessageResponse
from logger import log_contact_created, log_contact_status_changed, log_contact_deleted, log_error

router = APIRouter(
    prefix="/contact",
    tags=["Contact"],
)


# ── POST /contact ─────────────────────────────────────────
@router.post(
    "/",
    response_model=ContactOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a contact message",
)
def create_message(payload: ContactCreate, db: Session = Depends(get_db)):
    """
    Accepts a contact form submission and saves it to the database
    with status 'unread'. Returns the created message record.
    """
    msg = ContactMessage(**payload.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    log_contact_created(msg)
    return msg


# ── GET /contact ──────────────────────────────────────────
@router.get(
    "/",
    response_model=List[ContactOut],
    summary="List all contact messages (admin)",
)
def list_messages(
    skip:   int = 0,
    limit:  int = 50,
    status: Optional[ContactStatus] = None,
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(require_admin),
):
    """
    Returns a paginated list of contact messages.
    Optionally filter by status: unread | read | replied
    """
    query = db.query(ContactMessage)
    if status:
        query = query.filter(ContactMessage.status == status)
    return query.order_by(ContactMessage.created_at.desc()).offset(skip).limit(limit).all()


# ── GET /contact/{id} ────────────────────────────────────
@router.get(
    "/{message_id}",
    response_model=ContactOut,
    summary="Get a single contact message by ID",
)
def get_message(
    message_id: int,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(require_admin),
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message {message_id} not found",
        )
    return msg


# ── PATCH /contact/{id} ───────────────────────────────────
@router.patch(
    "/{message_id}",
    response_model=ContactOut,
    summary="Update message status (admin)",
)
def update_message_status(
    message_id: int,
    new_status: ContactStatus,
    db:         Session = Depends(get_db),
    admin:      dict    = Depends(require_admin),
):
    """
    Allows an admin to mark a message as read or replied.
    """
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message {message_id} not found",
        )
    msg.status = new_status
    db.commit()
    db.refresh(msg)
    log_contact_status_changed(message_id, new_status.value)
    return msg


# ── DELETE /contact/{id} ─────────────────────────────────
@router.delete(
    "/{message_id}",
    response_model=MessageResponse,
    summary="Delete a contact message (admin)",
)
def delete_message(
    message_id: int,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(require_admin),
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message {message_id} not found",
        )
    db.delete(msg)
    db.commit()
    log_contact_deleted(message_id)
    return {"message": f"Message {message_id} deleted successfully"}
