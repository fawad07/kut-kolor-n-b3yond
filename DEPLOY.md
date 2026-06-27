# Deploying Kut, Kolor N B3yond

Your site has two parts that get hosted separately:

- **Backend** (the API + database logic) → **Render**
- **Frontend** (the website people see) → **Vercel**

Both are free to host. You'll do this in the browser — no terminal needed.
The config files (`kkb-backend/render.yaml`, `kkb-salon/vercel.json`) are
already in the repo, so the hosts mostly configure themselves.

There's a small chicken-and-egg: each side needs the other's web address.
The order below handles that — deploy the backend first, then the frontend,
then come back and give the backend the frontend's address.

---

## Step 1 — Deploy the backend on Render

1. Go to https://render.com and sign in with GitHub.
2. **New → Blueprint**, pick the `kut-kolor-n-b3yond` repo, click **Apply**.
   Render reads `kkb-backend/render.yaml` and creates the service.
3. It will ask you to fill in the secret values (these are NOT in the repo).
   Paste each from your local `kkb-backend/.env`:
   - `DATABASE_URL` — your Neon Postgres connection string
   - `JWT_SECRET`
   - `ADMIN_PASSWORD_HASH`
   - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
   - `RESEND_API_KEY`, `SALON_EMAIL_FROM`, `SALON_PHONE`, `ADMIN_RECOVERY_EMAIL`
   - `FRONTEND_URL` — leave blank for now; we set it in Step 3.
4. Click **Create / Deploy** and wait for it to go live.
5. Copy your backend URL — it looks like `https://kkb-backend.onrender.com`.
   Test it by visiting `that-url/health` — you should see `{"status":"healthy"}`.

## Step 2 — Deploy the frontend on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New → Project**, import the `kut-kolor-n-b3yond` repo.
3. **Important:** set **Root Directory** to `kkb-salon` (click Edit next to it).
   Vercel auto-detects Vite from there.
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = your backend URL from Step 1 (e.g. `https://kkb-backend.onrender.com`)
5. Click **Deploy**. When it finishes, copy your site URL
   (e.g. `https://kkb-salon.vercel.app`).

## Step 3 — Connect the two

1. Back in **Render → your service → Environment**, set:
   - `FRONTEND_URL` = your Vercel URL from Step 2.
2. Save — Render redeploys automatically.

This lets the backend accept requests from your live site (CORS) and makes
the admin login cookie work across the two domains.

## Step 4 — Check it works

- Visit your Vercel URL → the site loads.
- Submit a test booking → it should succeed.
- Go to `your-vercel-url/admin`, log in → bookings/messages load.

---

## Good to know

- **First load can be slow.** Render's free tier sleeps after ~15 min idle;
  the first request wakes it (can take ~30–60s). Paid plans stay awake.
- **Logs are temporary on the free tier.** The `logs/` files reset on each
  redeploy. The database (bookings, messages, admin password) persists fine.
  For permanent log history later, add a logging service.
- **Database tables** create themselves on first startup. If you later adopt
  Alembic on the live DB, run `alembic stamp head` once (see
  `kkb-backend/migrations/README`).
- **Custom domain:** once you buy one, add it in both Vercel (frontend) and
  update `FRONTEND_URL` in Render, then update the canonical/`og:url` in
  `kkb-salon/index.html`.
- **Rich link previews:** add a 1200×630 image at `kkb-salon/public/og-image.jpg`.
