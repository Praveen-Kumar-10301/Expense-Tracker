# Deploying Expense Tracker (Render + Turso, free)

This app deploys as **one Render web service** that serves the React build **and** the
API on the same origin, with data stored in a free **Turso** (libSQL) database so it
survives redeploys and idle sleep.

- Frontend + API: Render free web service
- Database: Turso free tier
- Cost: ₹0 (free tiers). Note Render's free service **sleeps after ~15 min idle** and
  takes ~30–60s to wake on the next request.

---

## Prerequisites

- A **GitHub** account (Render deploys from a Git repo)
- A **Render** account → https://render.com (sign up with GitHub)
- A **Turso** account → https://turso.tech

---

## Step 1 — Create the Turso database

Easiest via the Turso CLI. Install it:

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash
# Windows (PowerShell) — use WSL, or install via the official instructions at
# https://docs.turso.tech/cli/installation
```

Then:

```bash
turso auth signup           # opens browser; or `turso auth login`
turso db create expense-tracker

# Get the two values you'll paste into Render:
turso db show --url expense-tracker     # -> libsql://expense-tracker-<org>.turso.io
turso db tokens create expense-tracker  # -> a long auth token
```

Keep the **URL** and **token** handy. (No need to create tables — the server runs its
migrations automatically on first boot.)

> Prefer no CLI? You can do the same from the Turso web dashboard: create a database,
> copy its libSQL URL, and create a database token.

---

## Step 2 — Push the code to GitHub

This project isn't a git repo yet. From the project root:

```bash
git init
git add .
git commit -m "Expense Tracker ready for deploy"
git branch -M main
# create an empty repo on GitHub first, then:
git remote add origin https://github.com/<you>/expense-tracker.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.env`, the local `*.db` files, and
`client/dist/`, so none of those get committed.

---

## Step 3 — Deploy on Render

You can use the included **Blueprint** (`render.yaml`) or configure manually.

### Option A — Blueprint (recommended)

1. Render dashboard → **New +** → **Blueprint**.
2. Select your GitHub repo. Render reads `render.yaml` and proposes one web service.
3. Click **Apply**. `JWT_SECRET` is generated automatically.
4. After it's created, open the service → **Environment** and set the two secrets:
   - `TURSO_DATABASE_URL` = the `libsql://...` URL from Step 1
   - `TURSO_AUTH_TOKEN` = the token from Step 1
5. **Save** → Render redeploys.

### Option B — Manual web service

1. **New +** → **Web Service** → pick the repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. **Environment** → add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = a long random string (32+ chars)
   - `TURSO_DATABASE_URL` = `libsql://...`
   - `TURSO_AUTH_TOKEN` = your token
4. **Create Web Service**.

On boot the server runs `runMigrations()` against Turso, so the schema is created on the
first deploy. Watch the deploy logs for `Migration applied: ...` then
`Server running on ...`.

---

## Step 4 — Verify

- Visit `https://<your-service>.onrender.com` → the app loads.
- `https://<your-service>.onrender.com/api/v1/health` → `{"status":"ok",...}`.
- Register an account, add an expense, set a budget/income, then **redeploy** — your data
  should still be there (that's Turso doing its job).

---

## How it works (for reference)

- **Single origin:** `server/index.js` serves `client/dist` and the `/api/v1` routes from
  the same host, so the `httpOnly` auth cookie (`sameSite=strict`, `secure`) just works —
  no CORS or cross-site cookie config needed. `app.set('trust proxy', 1)` lets the secure
  cookie work behind Render's HTTPS proxy.
- **Database:** `server/db/database.js` uses `TURSO_DATABASE_URL` in production and falls
  back to a local SQLite file in development, so `npm run dev` needs no cloud setup.

---

## Local development (unchanged)

```bash
# terminal 1 — API on :3001 (uses a local SQLite file, no Turso needed)
cd server && cp .env.example .env   # set a JWT_SECRET; leave TURSO_* blank
npm install && npm run dev

# terminal 2 — Vite dev server on :5173 (proxies /api to :3001)
cd client && npm install && npm run dev
```

---

## Custom domain (optional)

Render → your service → **Settings → Custom Domains** → add your domain and follow the
DNS instructions. TLS is provisioned automatically. The single-origin setup means no app
changes are needed.

---

## Troubleshooting

- **App loads but API calls fail / can't log in:** confirm `TURSO_DATABASE_URL` and
  `TURSO_AUTH_TOKEN` are set and the deploy logs show migrations applied. A missing/typo'd
  token shows up as DB errors in the logs.
- **First request is slow:** expected on Render free (cold start after idle). Upgrade to a
  paid instance to keep it always-on.
- **Want to inspect the DB:** `turso db shell expense-tracker` then run SQL.
