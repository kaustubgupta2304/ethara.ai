# Deploy Team Task Manager on Railway (step by step)

This guide walks through deploying the **API** (Express + Prisma + PostgreSQL) and the **React frontend** as **two separate Railway services**, sharing one **Railway Postgres** database.

**Prerequisites**

- GitHub (or GitLab) repo pushed with this project code.
- A [Railway](https://railway.app/) account (sign in with GitHub).

---

## Overview

| Service | Railway “Root Directory” | Purpose |
|--------|----------------------------|---------|
| **PostgreSQL** | (plugin) | Database; Railway injects `DATABASE_URL` into linked services. |
| **Backend** | `backend` | REST API on Node; runs migrations then `npm start`. |
| **Frontend** | `frontend` | Static SPA; build bakes in `VITE_API_BASE_URL`; `serve` listens on `PORT`. |

You will:

1. Create a Railway project and add Postgres.
2. Deploy the **backend**, attach the database, set env vars, get a **public URL**.
3. Deploy the **frontend** with `VITE_API_BASE_URL` pointing at the backend URL.
4. Set the backend’s **`CLIENT_ORIGIN`** to the **frontend public URL** and redeploy the backend (for CORS).

Config files in this repo:

- `backend/railway.toml` — start command runs `prisma migrate deploy` then the API.
- `frontend/railway.toml` — start command runs `npm start` (serves `dist` on `PORT`).
- `frontend/scripts/listen.mjs` — runs `serve` on `0.0.0.0:$PORT` (required for Railway).

---

## Step 1 — Create a project and database

1. Log in to **[railway.app](https://railway.app/)**.
2. Click **New Project**.
3. Choose **Empty Project** (or **Deploy from GitHub repo** and pick the repo later—you can add the DB first).
4. In the project, click **+ New** → **Database** → **PostgreSQL**.
5. Wait until Postgres shows as **Active**.
6. **(Optional but recommended)** Open the Postgres service → **Variables** and note that **`DATABASE_URL`** exists (you will reference it from the backend).

Do **not** expose the raw `DATABASE_URL` publicly in screenshots or GitHub issues.

---

## Step 2 — Deploy the backend (API)

1. In the same Railway project, click **+ New** → **GitHub Repo** (or **Dockerfile** if you prefer; this guide assumes **GitHub**).
2. Select the repository that contains **this codebase**.
3. Railway creates a **service**. Open **Settings** for that service:

   - **Root Directory:** set to `backend`  
     (so Railway runs `npm install` inside `backend/` and finds `package.json` there.)

4. Open the **Variables** tab for the **backend** service:

   | Variable | Value / how to set |
   |----------|---------------------|
   | `DATABASE_URL` | Click **Add Variable** → **Add Reference** → choose the **PostgreSQL** service → **`DATABASE_URL`**. This links the API to the database. |
   | `JWT_SECRET` | A long random string (e.g. 32+ characters). Generate one locally: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `NODE_ENV` | `production` |
   | `CLIENT_ORIGIN` | **Temporary:** `http://localhost:5173` — you will **change this** in Step 5 to your **frontend HTTPS URL** (comma-separated if you have multiple origins, e.g. custom domain + Railway URL). |

5. **Generate a public domain** for the backend: **Settings** → **Networking** → **Generate Domain**.  
   Example: `https://your-api-name.up.railway.app`  
   Copy this URL and remove any trailing slash — call this **`BACKEND_URL`**.

6. Trigger a deploy (or wait for the first deploy to finish).  
   - The start command in `backend/railway.toml` is:  
     `npm start`  
   - Migrations run automatically via `preDeployCommand`: `npx prisma migrate deploy`  
   - First deploy applies migrations in `backend/prisma/migrations/`.

7. **Verify the API**

   In a browser or with curl:

   ```text
   GET https://YOUR-BACKEND-URL.up.railway.app/api/health
   ```

   You should see JSON like: `{"ok":true,"service":"team-task-manager-api"}`.

8. **Seed demo users (first time only, optional)**

   Railway: open the **backend** service → **Settings** → look for **Deploy** → **Custom Start Command** — **do not** permanently add seed to start command for production unless you accept resetting demo passwords on every deploy.

   **One-off seed** options:

   - **Railway CLI:** install CLI, link project, run a one-off command on the service:  
     `railway run --service <backend-service-name> npm run db:seed`  
     (Exact CLI syntax may vary; see [Railway CLI docs](https://docs.railway.app/develop/cli).)
   - Or from your machine (with production `DATABASE_URL` in env):  
     `cd backend && DATABASE_URL="postgresql://..." npm run db:seed`

   After seeding, you can log in as:

   - Admin: `admin@example.com` / `Admin123!`
   - Member: `member@example.com` / `Member123!`

---

## Step 3 — Deploy the frontend

1. In the same project, **+ New** → **GitHub Repo** → select the **same repository** again (Railway allows multiple services from one repo).

2. **Settings** → **Root Directory:** `frontend`

3. **Variables** (these must be present **before** or **during** build so Vite can embed the API URL):

   | Variable | Example value |
   |----------|----------------|
   | `VITE_API_BASE_URL` | `https://your-api-name.up.railway.app` — **no** `/api` suffix, **no** trailing slash. Same as `BACKEND_URL` from Step 2. |

4. **Networking** → **Generate Domain** for the frontend.  
   Example: `https://your-web-name.up.railway.app` — call this **`FRONTEND_URL`**.

5. Wait for build + deploy. The frontend `railway.toml` uses `npm start`, which runs `node scripts/listen.mjs` and serves `dist` on **`PORT`** (Railway sets `PORT` automatically).

6. Open **`FRONTEND_URL`** in the browser. You should see the login page. Try signing in (after seed) or registering.

If the UI loads but API calls fail (CORS or network), continue to Step 4 and Step 5.

---

## Step 4 — CORS: point the API at your real frontend origin

The API only allows origins listed in **`CLIENT_ORIGIN`** (see `backend/src/app.js`).

1. Open the **backend** service → **Variables**.
2. Set **`CLIENT_ORIGIN`** to your **`FRONTEND_URL`** exactly as the browser uses it:

   - Example: `https://your-web-name.up.railway.app`
   - Multiple origins: comma-separated, no spaces unless you trim them (the app splits on comma and trims).

3. **Redeploy** the backend service so the new variable is picked up.

---

## Step 5 — Rebuild frontend if you change the API URL

If you ever change the backend’s public URL:

1. Update **`VITE_API_BASE_URL`** on the **frontend** service.
2. Trigger a **new deploy** of the frontend (the URL is compiled in at **build** time).

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Backend deploy fails on migrations | Logs: DB unreachable? Is `DATABASE_URL` referenced from the **Postgres** plugin? Is Root Directory `backend`? |
| `502` / app won’t start | Logs: Does `npx prisma migrate deploy` pass? Is `JWT_SECRET` set? |
| Frontend loads, login fails, console CORS error | **`CLIENT_ORIGIN`** on backend must match the frontend origin (scheme + host + port). Redeploy backend after changing it. |
| Frontend calls wrong API | Rebuild frontend with correct **`VITE_API_BASE_URL`** (no `/api`, no trailing slash). |
| Health check fails | Backend health route is **`GET /api/health`** — matches `backend/railway.toml`. |

---

## Local development with PostgreSQL (matches Railway)

From the **repository root**:

```bash
docker compose up -d
```

Set `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/teamtasks?schema=public"
JWT_SECRET="local-dev-secret"
CLIENT_ORIGIN="http://localhost:5173"
PORT=4000
NODE_ENV=development
```

Then:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

---

## Quick checklist

- [ ] Postgres plugin active; backend has **referenced** `DATABASE_URL`.
- [ ] Backend: `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_ORIGIN` = **frontend** URL.
- [ ] Backend public URL works: `/api/health`.
- [ ] Frontend: `VITE_API_BASE_URL` = **backend** URL (no `/api`).
- [ ] Optional: `npm run db:seed` once against production DB for demo accounts.

---

**Project author:** Kaustubh Gupta.
