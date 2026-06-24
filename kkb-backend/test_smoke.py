"""
test_smoke.py — throwaway smoke test for the KKB backend.

Runs against an isolated temp SQLite DB (never touches production Postgres)
and disables outbound email. Exercises the real endpoints end-to-end:
bookings, conflict detection, validation, auth enforcement, contact, logs.

Run:  ./venv/bin/python test_smoke.py
"""
import os
import tempfile

# ── Isolate BEFORE importing the app ──────────────────────
_tmp_db = os.path.join(tempfile.gettempdir(), "kkb_smoke.db")
if os.path.exists(_tmp_db):
    os.remove(_tmp_db)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_db}"
os.environ["RESEND_API_KEY"] = ""        # disable real email sends
os.environ["APP_ENV"] = "development"

from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

import main
import auth
from database import get_db, Base

# Override DB dependency with a thread-safe SQLite session
_engine = create_engine(
    os.environ["DATABASE_URL"],
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=_engine)
_TestSession = sessionmaker(bind=_engine, autoflush=False, autocommit=False)

def _override_get_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()

main.app.dependency_overrides[get_db] = _override_get_db
client = TestClient(main.app)

FUTURE = (date.today() + timedelta(days=10)).isoformat()
PASSED = []
FAILED = []

def check(name, cond, detail=""):
    (PASSED if cond else FAILED).append(name)
    print(f"  {'✅' if cond else '❌'} {name}" + (f"  — {detail}" if detail and not cond else ""))

def booking(**over):
    b = dict(full_name="Test Client", email="client@example.com",
             phone="(555) 123-4567", service="Haircut", stylist="Any available",
             preferred_date=FUTURE, preferred_time="10:00 AM", notes="")
    b.update(over); return b

print("\n── Public booking flow ──────────────────────────────")
r = client.post("/bookings/", json=booking())
check("Create valid booking → 201", r.status_code == 201, r.text)

r2 = client.post("/bookings/", json=booking(full_name="Second Client"))
check("Double-book same slot ('Any available') → 409", r2.status_code == 409, f"got {r2.status_code}")

r3 = client.get("/bookings/availability", params={"date": FUTURE, "time": "10:00 AM"})
check("Availability reports slot taken", r3.json().get("available") is False, r3.text)

r4 = client.get("/bookings/availability", params={"date": FUTURE, "time": "2:00 PM"})
check("Availability reports free slot open", r4.json().get("available") is True, r4.text)

print("\n── Validation ───────────────────────────────────────")
r = client.post("/bookings/", json=booking(preferred_date="2020-01-01", preferred_time="3:00 PM"))
check("Past date rejected → 422", r.status_code == 422, f"got {r.status_code}")

r = client.post("/bookings/", json=booking(preferred_date="not-a-date", preferred_time="3:00 PM"))
check("Malformed date rejected → 422", r.status_code == 422, f"got {r.status_code}")

r = client.post("/bookings/", json=booking(phone="12345"))
check("Bad phone rejected → 422", r.status_code == 422, f"got {r.status_code}")

r = client.post("/bookings/", json=booking(email="not-an-email"))
check("Bad email rejected → 422", r.status_code == 422, f"got {r.status_code}")

print("\n── Auth enforcement ─────────────────────────────────")
check("GET /bookings/ no cookie → 401", client.get("/bookings/").status_code == 401)
check("GET /contact/ no cookie → 401", client.get("/contact/").status_code == 401)
check("GET /logs/recent no cookie → 401", client.get("/logs/recent").status_code == 401)

token = auth.create_access_token()
authed = {"cookie": f"{auth.COOKIE_NAME}={token}"}
ra = client.get("/bookings/", headers=authed)
check("GET /bookings/ with valid session → 200", ra.status_code == 200, ra.text)
check("Listed bookings include the created one", any(b["full_name"] == "Test Client" for b in ra.json()))

print("\n── Contact flow ─────────────────────────────────────")
rc = client.post("/contact/", json={"name": "Jane", "email": "jane@example.com",
                                     "message": "I would like to ask about colour services please."})
check("Create contact message → 201", rc.status_code == 201, rc.text)
check("List contact (authed) → 200", client.get("/contact/", headers=authed).status_code == 200)

print("\n── Admin edit / reactivation ────────────────────────")
ebid = client.post("/bookings/", json=booking(preferred_time="4:00 PM")).json()["id"]
client.patch(f"/bookings/{ebid}", json={"status": "cancelled"}, headers=authed)
edit_payload = booking(full_name="Edited Name", preferred_time="4:00 PM")
re_edit = client.put(f"/bookings/{ebid}/admin", json=edit_payload, headers=authed)
check("Edit cancelled booking → 200", re_edit.status_code == 200, re_edit.text)
check("Cancelled booking reactivates to pending", re_edit.json().get("status") == "pending",
      f"got {re_edit.json().get('status')}")
# Editing with a bad value must return a string-friendly 422 (the frontend now
# normalises this; here we just confirm it's a structured 422, not a 500).
re_bad = client.put(f"/bookings/{ebid}/admin",
                    json=booking(preferred_date="2020-01-01"), headers=authed)
check("Edit with past date → 422 (not 500)", re_bad.status_code == 422, f"got {re_bad.status_code}")

print("\n── Late-cancellation timezone helper (California) ────")
from routers.payments import _is_late_cancellation, SALON_TZ
from datetime import datetime
now_pst = datetime.now(SALON_TZ)
soon = now_pst + timedelta(hours=5)      # within 24h → late
far  = now_pst + timedelta(days=5)       # outside 24h → normal
check("Appt 5h away = late cancellation",
      _is_late_cancellation(soon.strftime("%Y-%m-%d"), soon.strftime("%-I:%M %p")) is True)
check("Appt 5 days away = NOT late",
      _is_late_cancellation(far.strftime("%Y-%m-%d"), far.strftime("%-I:%M %p")) is False)
check("SALON_TZ is America/Los_Angeles", str(SALON_TZ) == "America/Los_Angeles")

print("\n══════════════════════════════════════════════════════")
print(f"  PASSED: {len(PASSED)}    FAILED: {len(FAILED)}")
if FAILED:
    print("  Failing:", ", ".join(FAILED))
print("══════════════════════════════════════════════════════")
os.remove(_tmp_db)
raise SystemExit(1 if FAILED else 0)
