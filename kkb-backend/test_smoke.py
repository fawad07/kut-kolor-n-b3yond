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

print("\n── Security: rate limit, password hash, reset tokens ──")
import auth as _auth
import logging as _logging
from password_reset import generate_reset_token, validate_reset_token, consume_reset_token

# Capture admin audit-log records emitted during this run
_captured = []
class _CaptureHandler(_logging.Handler):
    def emit(self, record):
        _captured.append(record)
_logging.getLogger("kkb.admin").addHandler(_CaptureHandler())

# 1. Admin password hash persists in the DB (survives a fresh session)
_s = _TestSession()
_auth.set_password_hash(_s, _auth.hash_password("CurrentPass123"))
_s.close()
_s = _TestSession()
check("Admin password hash persists in DB",
      _auth.verify_password("CurrentPass123", _auth.get_password_hash(_s)) is True)
_s.close()

# 2. Reset token lifecycle (DB-backed, single use)
_s = _TestSession()
tok = generate_reset_token(_s)
check("Reset token validates after creation", validate_reset_token(_s, tok) is True)
consume_reset_token(_s, tok)
check("Reset token is single-use", validate_reset_token(_s, tok) is False)
check("Unknown reset token is invalid", validate_reset_token(_s, "nope") is False)
_s.close()

# 3. Reuse prevention — cannot reset to the current password
_s = _TestSession(); reuse_tok = generate_reset_token(_s); _s.close()
rr = client.post("/auth/reset-password", json={"token": reuse_tok, "new_password": "CurrentPass123"})
check("Reset rejects reusing current password → 400", rr.status_code == 400, f"got {rr.status_code}")

# 4. Correct password logs in
_auth.reset_attempts("testclient")
ok = client.post("/auth/login", json={"password": "CurrentPass123"})
check("Correct password logs in → 200", ok.status_code == 200, f"got {ok.status_code}")

# 5. Rate limiting — locked out after 5 failed attempts
_auth.reset_attempts("testclient")
for _ in range(5):
    client.post("/auth/login", json={"password": "wrong"})
blocked = client.post("/auth/login", json={"password": "wrong"})
check("Login locks out after 5 failures → 429", blocked.status_code == 429, f"got {blocked.status_code}")

# 6. A valid reset changes the password and consumes the token
_s = _TestSession(); good_tok = generate_reset_token(_s); _s.close()
rok = client.post("/auth/reset-password", json={"token": good_tok, "new_password": "BrandNewPass456"})
check("Valid reset succeeds → 200", rok.status_code == 200, f"got {rok.status_code}")
_s = _TestSession()
check("Token cannot be reused after a successful reset", validate_reset_token(_s, good_tok) is False)
check("New password is now active",
      _auth.verify_password("BrandNewPass456", _auth.get_password_hash(_s)) is True)
_s.close()

print("\n── Audit logging — every reset/login outcome recorded ──")
# Trigger each reset failure type and a reset request explicitly
client.post("/auth/forgot-password")
client.post("/auth/reset-password", json={"token": "totally-bad", "new_password": "Whatever123"})
_s = _TestSession(); short_tok = generate_reset_token(_s); _s.close()
client.post("/auth/reset-password", json={"token": short_tok, "new_password": "short"})
_s = _TestSession(); reuse2 = generate_reset_token(_s); _s.close()
client.post("/auth/reset-password", json={"token": reuse2, "new_password": "BrandNewPass456"})

_actions = [getattr(r, "action", None) for r in _captured]
_reasons = [getattr(r, "reason", None) for r in _captured]
check("Reset request is logged",                "password_reset_requested" in _actions)
check("Invalid-token reset is logged",          "invalid_or_expired_token" in _reasons)
check("Too-short reset is logged",              "password_too_short" in _reasons)
check("Reuse-of-password reset is logged",      "password_reused" in _reasons)
check("Successful password change is logged",   "password_reset_completed" in _actions)
check("Failed login is logged",                 "login_failed" in _actions)
check("Rate-limit lockout is logged",           "login_rate_limited" in _actions)
check("Every captured admin entry has an IP",
      all(getattr(r, "ip", None) for r in _captured
          if getattr(r, "action", "").startswith(("login_", "password_reset"))))

print("\n── Request logging — every HTTP call is recorded ──")
_req_captured = []
class _ReqCap(_logging.Handler):
    def emit(self, record):
        _req_captured.append(record)
_logging.getLogger("kkb.request").addHandler(_ReqCap())

client.get("/bookings/availability", params={"date": FUTURE, "time": "9:00 AM"})   # 200
client.get("/bookings/99999", headers=authed)                                      # 404
client.post("/contact/", json={"name": "Log Test", "email": "l@e.com",
                               "message": "Testing the request logger please."})   # 201
client.get("/logs/recent", headers=authed)   # should be SKIPPED (no self-logging)

_req_actions = [getattr(r, "action", None) for r in _req_captured]
_req_codes   = [getattr(r, "status_code", None) for r in _req_captured]
check("HTTP requests are logged", "http_request" in _req_actions and len(_req_captured) >= 3)
check("A 404 request is logged", 404 in _req_codes)
check("A 201 request is logged", 201 in _req_codes)
check("Request entries include method, path and IP",
      all(getattr(r, "method", None) and getattr(r, "path", None) and getattr(r, "ip", None)
          for r in _req_captured))
check("Log-viewer endpoint is skipped (no self-logging)",
      all(not str(getattr(r, "path", "")).startswith("/logs") for r in _req_captured))

print("\n══════════════════════════════════════════════════════")
print(f"  PASSED: {len(PASSED)}    FAILED: {len(FAILED)}")
if FAILED:
    print("  Failing:", ", ".join(FAILED))
print("══════════════════════════════════════════════════════")
os.remove(_tmp_db)
raise SystemExit(1 if FAILED else 0)
