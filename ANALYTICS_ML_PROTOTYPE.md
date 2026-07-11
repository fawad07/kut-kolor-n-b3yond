# Analytics & ML — Prototype / Future Enhancement Spec

> **Status: NOT IMPLEMENTED. Design only.** This document describes a future
> enhancement. Nothing here is wired into the running app; the live booking
> flow is untouched. It exists so the work is scoped and ready to build later.

## Goal

Understand the salon's business from its own booking data:

- Which **services** are booked most, and which bring the most revenue.
- Which **clients** come frequently, how much they spend, and who is slipping away.
- Which **booking patterns succeed** (get completed) vs. cancel / no-show — by
  day, time, service, stylist, and how far ahead the booking was made.

**Guiding principle:** most of this is *analytics* (counting & grouping), not
machine learning. Build the analytics first; add ML only where it earns its keep
and only once there is enough data.

---

## 0. Data foundation (prerequisite)

The current schema can't fully answer these questions yet. Three additions are
needed (all additive, non-breaking — same safe pattern as the consent columns):

### a) `customers` table — link a person's visits together
Bookings currently store a name/email/phone but aren't tied to a persistent
customer. Add a customers table and link bookings to it (dedupe by lowercased
email, fall back to phone).

```sql
CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE,      -- lowercased
    phone       VARCHAR(30),
    full_name   VARCHAR(120),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE bookings ADD COLUMN customer_id INTEGER REFERENCES customers(id);
```
On booking creation: find-or-create the customer by email, set `customer_id`.
Backfill once for existing rows by grouping on email.

### b) Record actual spend
Only cancellation fees are currently stored. Capture what a visit actually
earned when a booking is marked **completed**:

```sql
ALTER TABLE bookings ADD COLUMN amount_paid NUMERIC(8,2);  -- set at completion
```
(Admin enters/confirms the amount when marking a booking completed. Until real
POS/Stripe revenue is integrated, this is the source of "spend".)

### c) Service catalog (optional, nice-to-have)
Services are free-text today. A small `services` table (name, category, base
price, duration) makes reporting cleaner and enables per-service revenue without
string matching.

---

## 1. Analytics layer (no ML — ~80% of the value)

Plain SQL, surfaced in a new admin **Insights** tab. Examples:

**Top services by volume & revenue**
```sql
SELECT service,
       COUNT(*)                           AS bookings,
       COUNT(*) FILTER (WHERE status='completed') AS completed,
       COALESCE(SUM(amount_paid),0)       AS revenue
FROM bookings
GROUP BY service
ORDER BY revenue DESC;
```

**Top / most frequent clients (visits + spend)**
```sql
SELECT c.full_name, c.email,
       COUNT(b.id)                              AS visits,
       COALESCE(SUM(b.amount_paid),0)           AS total_spend,
       ROUND(AVG(b.amount_paid),2)              AS avg_ticket,
       MAX(b.preferred_date)                    AS last_visit
FROM customers c
JOIN bookings b ON b.customer_id = c.id
WHERE b.status = 'completed'
GROUP BY c.id
ORDER BY total_spend DESC
LIMIT 25;
```

**RFM scores** (Recency, Frequency, Monetary — the standard way to rank clients;
buckets each into 1–5, e.g. "555" = best). Computed in SQL with `NTILE(5)` or in
pandas.

**"Successful booking patterns" — completion vs. no-show rates**
```sql
SELECT preferred_time,
       COUNT(*)                                                   AS total,
       ROUND(100.0*COUNT(*) FILTER (WHERE status='completed')/COUNT(*),1) AS completion_pct,
       ROUND(100.0*COUNT(*) FILTER (WHERE status='cancelled')/COUNT(*),1) AS cancel_pct
FROM bookings
GROUP BY preferred_time
ORDER BY completion_pct DESC;
```
Same idea grouped by day-of-week, service, stylist, and **lead time**
(`preferred_date − created_at`) — lead time is often the strongest predictor of
no-shows.

**Revenue trend** — `SUM(amount_paid)` grouped by week/month.

---

## 2. ML layer (once there is enough history)

Backend is already Python, so add `pandas` + `scikit-learn`. Run as a **nightly
batch job**, not per-request. Candidate models:

- **Customer segmentation** — `KMeans` on RFM features → auto-group clients
  (VIP / regular / at-risk / one-timer) for targeted follow-ups.
  ```python
  from sklearn.cluster import KMeans
  from sklearn.preprocessing import StandardScaler
  X = scaler.fit_transform(rfm[["recency","frequency","monetary"]])
  rfm["segment"] = KMeans(n_clusters=4, n_init=10).fit_predict(X)
  ```
- **No-show / churn prediction** — a classifier (logistic regression or gradient
  boosting) trained on history. Features: lead time, day/time, service, stylist,
  prior no-shows, prior visits. Output: risk score → prompt a reminder or deposit.
- **Upsell associations** — market-basket / association rules ("clients who book
  Color often also book Treatments").
- **Demand forecasting** — seasonal averages or a light time-series model to
  predict busy days/times for staffing.

---

## 3. Integration architecture

```
Postgres (bookings + customers + amount_paid)
      │   nightly scheduled job (cron / existing scheduler)
      ▼
Python analytics + ML (pandas, scikit-learn)
      │   writes results → "insights" table (top clients, segments, risk flags…)
      ▼
FastAPI read-only endpoints (admin-only, require_admin)
      ▼
Admin "Insights" tab (charts, top clients, at-risk flags)
```

- Compute offline/nightly; the admin panel only *reads* precomputed results —
  fast, cheap, and safe for salon-scale data.
- All endpoints behind `require_admin`; every access logged (existing audit log).

---

## 4. Privacy & caveats

- This is customer **PII + spend** — keep it internal/admin-only. Covered by the
  existing Privacy Policy (no selling; honor deletion requests / CCPA).
- **Volume matters.** A single-stylist salon produces modest data; for a long
  while the Stage-1 analytics will beat any ML model. ML on thin data overfits.
- **Start from the question, not the model.** "Who are my top 20 clients?" is a
  query. "Which booking will no-show?" is where ML earns its place — later.

---

## 5. Suggested rollout

1. **Stage 0** — add `customers`, `amount_paid`, (optional) `services`; link +
   backfill. (Alembic migrations.)
2. **Stage 1** — admin **Insights** tab: top services, top clients, RFM,
   completion-rate by day/time, revenue trend. *No ML.*
3. **Stage 2** — nightly job + segmentation + no-show risk, surfaced in Insights.
4. **Stage 3** — associations / demand forecasting; refine as data grows.

Stages 0–1 also produce the clean, labeled dataset any future ML would need.
