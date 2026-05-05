# Team Task Manager — Full-Stack Web Application

A production-style **team task management** platform: users authenticate with JWT, **Admins** run projects and assign work, and **Members** focus on **tasks assigned to them**. The stack is **React (Vite)** + **Tailwind** on the front end and **Node.js (Express)** + **Prisma** + **PostgreSQL** on the API. Local development uses Docker Compose for Postgres; production targets **Railway** — see **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)** for a full walkthrough.

**Author:** This project is **solely developed by Kaustubh Gupta**.

---

## Table of contents

1. [Overview](#overview)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Repository structure](#repository-structure)
6. [Prerequisites](#prerequisites)
7. [Environment variables](#environment-variables)
8. [Local setup (step by step)](#local-setup-step-by-step)
9. [Database (PostgreSQL)](#database-postgresql)
10. [Demo accounts & seeding](#demo-accounts--seeding)
11. [Running the built app locally](#running-the-built-app-locally)
12. [API reference](#api-reference)
13. [Frontend routes & UX](#frontend-routes--ux)
14. [Deploying to Railway](#deploying-to-railway)
15. [Troubleshooting](#troubleshooting)
16. [Security & production notes](#security--production-notes)
17. [Scripts cheat sheet](#scripts-cheat-sheet)
18. [License](#license)

---

## Overview

**Goal:** Build a web app where teams can create **projects**, add **members**, create **tasks** under projects, assign tasks to users, and track **status** and **due dates**, with **role-based access** (Admin vs Member) and a **dashboard** that surfaces totals, filters, and overdue work.

**What you get in this repo:**

- REST API with validation (Zod), structured errors, JWT auth, bcrypt password hashing, and RBAC middleware.
- SPA dashboard with login/register, protected routes, project and task management, stats, dark mode, toasts, and responsive layout.
- Prisma schema for **User**, **Project**, **ProjectMember**, and **Task**, with scripts to push schema, migrate (PostgreSQL), and seed demo users.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| **Frontend** | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios |
| **UI / UX** | Custom dashboard layout, `react-hot-toast`, dark mode (`class` on `<html>`), password visibility toggle on auth forms |
| **Backend** | Node.js 18+, Express 4, ES modules |
| **Auth** | JWT (Bearer tokens), bcryptjs (cost factor 12) |
| **Validation** | Zod (request bodies & queries) |
| **ORM** | Prisma 5 + `@prisma/client` |
| **Database** | **PostgreSQL** (local via **[Docker Compose](docker-compose.yml)**; hosted via **Railway Postgres**) |
| **Hosting guide** | **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)** — step-by-step API + web + DB on Railway |
| **Production static** | `serve` via `frontend/scripts/listen.mjs` (binds `0.0.0.0:$PORT` for Railway) |

---

## Architecture

**Backend (MVC-style modular layout)**

- **`src/index.js`** — loads env, starts HTTP server.
- **`src/app.js`** — Express app: JSON body parser, CORS, route mounting, 404, global error handler.
- **`src/routes/`** — Thin routers wiring HTTP methods to controllers and middleware.
- **`src/controllers/`** — Business logic per domain (auth, projects, tasks, users).
- **`src/middleware/`** — `authenticate` (JWT), `requireAdmin`, `validateBody` / `validateQuery`, `errorHandler`.
- **`src/validators/`** — Zod schemas shared with route validation.
- **`src/utils/jwt.js`** — Sign and verify tokens.
- **`src/lib/prisma.js`** — Singleton `PrismaClient` (avoids connection spam in dev).

**Frontend**

- **`src/api/client.js`** — Axios instance: base URL (`/api` in dev via proxy, or `VITE_API_BASE_URL` in prod), `Authorization` header from `localStorage`, global error handling and 401 redirect.
- **`src/context/AuthContext.jsx`** — Current user, token, `login` / `register` / `logout`, `refreshUser`.
- **`src/context/ThemeContext.jsx`** — Light/dark preference persisted to `localStorage`.
- **`src/pages/`** — Login, Register, Dashboard, Projects list, Project detail (team + tasks).
- **`src/components/`** — Layout, task cards, stats, icons (e.g. password eye).

**Request flow (example)**  

`Browser → Vite proxy (dev) or public API URL → Express route → authenticate → requireAdmin (if needed) → Zod validate → controller → Prisma → JSON response`.

---

## Features

| Area | Description |
|------|-------------|
| **Authentication** | Register, login, JWT on each protected request; `/auth/me` for session bootstrap. Emails are normalized (trim + lowercase) on login/register. |
| **Roles** | `ADMIN`: full control over projects, members, and tasks. `MEMBER`: sees only **assigned** tasks in lists/stats; can update **their** task fields/status, not reassignment. |
| **Projects** | Admins create/update/delete projects. Creator is added as a member. Admins add/remove members (cannot remove project creator from team via API rule). |
| **Tasks** | Admins create/delete tasks; assignees must be **project members**. Status: `TODO`, `IN_PROGRESS`, `DONE`. Optional `dueDate`; API marks `overdue` when past due and not `DONE`. |
| **Dashboard** | Aggregate stats, filter by status, pagination, overdue emphasis. |
| **UI** | Responsive nav, dark mode toggle, loading states, toast notifications. |

---

## Repository structure

```text
.
├── README.md
├── RAILWAY_DEPLOY.md                  # Step-by-step Railway deployment
├── docker-compose.yml                 # Local PostgreSQL
├── backend/
│   ├── railway.toml                   # Railway: migrate deploy + start
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/                # SQL migrations (PostgreSQL)
│   └── src/
├── frontend/
│   ├── railway.toml
│   ├── scripts/listen.mjs             # serve dist on PORT (Railway)
│   ├── vite.config.js
│   └── src/
└── .gitignore
```

---

## Prerequisites

- **Node.js 18+** and **npm**.
- **Docker Desktop** (or compatible engine) recommended: run **`docker compose up -d`** from the repo root for local PostgreSQL. Or use any Postgres host and set `DATABASE_URL` in `backend/.env`.

---

## Environment variables

### Backend — copy `backend/.env.example` to `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL URL. Local (Docker Compose): `postgresql://postgres:postgres@127.0.0.1:5432/teamtasks?schema=public`. On Railway: **reference** the variable from the **PostgreSQL** service. |
| `JWT_SECRET` | Yes | Strong random string used to sign JWTs (never commit real secrets). |
| `JWT_EXPIRES_IN` | No | Default `7d` (e.g. `1h`, `24h`). |
| `PORT` | No | API port; default **4000**. |
| `CLIENT_ORIGIN` | Yes (prod) | Comma-separated allowed **CORS** origins, e.g. `http://localhost:5173,https://your-frontend.up.railway.app`. |
| `NODE_ENV` | No | `development` or `production` (affects error detail in responses). |

**Optional — seed overrides**

| Variable | Description |
|----------|-------------|
| `SEED_ADMIN_EMAIL` | Email for seeded admin (default `admin@example.com`, normalized to lowercase). |
| `SEED_ADMIN_PASSWORD` | Password for seeded admin. |
| `SEED_MEMBER_EMAIL` | Email for seeded member (default `member@example.com`). |
| `SEED_MEMBER_PASSWORD` | Password for seeded member. |

The seed **updates** password and role on each run so demo accounts stay recoverable if the DB already had those emails.

### Frontend — copy `frontend/.env.example` to `frontend/.env` when needed

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | **Production builds:** public origin of the API **without** a trailing `/api`, e.g. `https://your-api.up.railway.app`. **Leave empty in local dev** so requests go to `/api` and Vite proxies to port 4000. |

---

## Local setup (step by step)

### 1. Clone and open the repo

```bash
git clone <your-repo-url>
cd Kaustubh
```

### 2. Start PostgreSQL

From the **repository root** (where `docker-compose.yml` lives):

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
# Set JWT_SECRET; DATABASE_URL should match Docker Compose (see .env.example)
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

The API should log something like **API listening on port 4000**. Verify:

```http
GET http://localhost:4000/api/health
```

Expected JSON: `{ "ok": true, "service": "team-task-manager-api" }`.

### 4. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Sign in with a seeded account (see below) or register (new users are **MEMBER**).

### 5. Stop servers

Press `Ctrl+C` in each terminal, or stop the Node processes running the dev servers.

---

## Database (PostgreSQL)

- **`schema.prisma`** uses `provider = "postgresql"`. Apply schema changes with **`prisma migrate`** in development (`npm run db:migrate`) and **`prisma migrate deploy`** in CI/production (also wired in **`backend/railway.toml`**).
- **Local:** `docker-compose.yml` runs Postgres on port **5432** with user/password/db **`postgres` / `postgres` / `teamtasks`**.
- **Railway:** Add the **PostgreSQL** plugin and **reference** `DATABASE_URL` on the backend service — see **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)**.
- **`role`** and **`Task.status`** are stored as **text** columns (e.g. `ADMIN`, `TODO`).

---

## Demo accounts & seeding

After `npm run db:seed` (in `backend`):

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@example.com` | `Admin123!` |
| Member | `member@example.com` | `Member123!` |

- If login fails after experimenting, run **`npm run db:seed`** again to reset those accounts’ passwords and roles.
- **Registering** with the same email as the admin **before** seeding can create a member-first row; seeding with the updated script fixes admin by **upsert update**.

---

## Running the built app locally

**API (production mode):**

```bash
cd backend
npm start
```

**Frontend (static build):**

```bash
cd frontend
npm run build
npm start
# Serves dist/ on $PORT (default 3000); use PORT for cloud hosts
```

Set `VITE_API_BASE_URL` **at build time** so the static app knows where the API lives, and configure backend `CLIENT_ORIGIN` to match the URL where the frontend is served.

---

## API reference

**Base URL:** `/api`  
**Success:** `{ "success": true, "data": ... }`  
**Error:** `{ "success": false, "message": "..." }` or validation `{ "success": false, "message": "Validation failed", "errors": [{ "path", "message" }] }`  
**Auth header:** `Authorization: Bearer <token>`

### Auth

| Method | Path | Body | Notes |
|--------|------|------|--------|
| POST | `/auth/register` | `{ name, email, password }` | Creates `MEMBER`; returns `{ user, token }`. |
| POST | `/auth/login` | `{ email, password }` | Returns `{ user, token }`. |
| GET | `/auth/me` | — | Bearer required; returns `{ user }`. |

### Users (admin only)

| Method | Path | Response `data` |
|--------|------|------------------|
| GET | `/users` | `{ users: [{ id, name, email, role }] }` — used to pick members for projects. |

### Projects

| Method | Path | Notes |
|--------|------|--------|
| GET | `/projects` | Admin: all projects. Member: only projects where they are a member. |
| GET | `/projects/:id` | Member must belong to project. |
| POST | `/projects` | Admin: `{ name, description? }`. |
| PATCH | `/projects/:id` | Admin: partial update. |
| DELETE | `/projects/:id` | Admin. |
| POST | `/projects/:id/members` | Admin: `{ userId }`. |
| DELETE | `/projects/:id/members/:userId` | Admin; cannot remove creator as enforced by API. |

### Tasks

| Method | Path | Query / body |
|--------|------|----------------|
| GET | `/tasks/dashboard/stats` | — |
| GET | `/tasks` | `projectId?`, `status?` (`TODO` \| `IN_PROGRESS` \| `DONE`), `page?`, `limit?` |
| GET | `/tasks/:id` | — |
| POST | `/tasks`   | Admin: `{ title, description?, status?, dueDate?, projectId, assignedToId? }` |
| PATCH | `/tasks/:id` | Admin: any allowed field. Member: own task; cannot set `assignedToId`. |
| DELETE | `/tasks/:id` | Admin. |

**Health check (no auth):** `GET /api/health`

---

## Frontend routes & UX

| Path | Description |
|------|-------------|
| `/login` | Sign in; password field has **show/hide** control. |
| `/register` | Sign up as member; same password toggle. |
| `/` | Dashboard: stats, task list, filters, pagination. |
| `/projects` | Project list; admin can create/delete. |
| `/projects/:id` | Project detail: team, task list, filters; admin adds members and tasks. |

Layout includes **dark mode** toggle and **logout**.

---

## Deploying to Railway

Follow the detailed guide: **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)** (Postgres plugin → backend service `root: backend` → frontend service `root: frontend` → CORS + `VITE_API_BASE_URL`).

Summary:

| Piece | Notes |
|--------|--------|
| **Database** | Railway **PostgreSQL**; backend references `DATABASE_URL`. |
| **Backend** | Root **`backend`**; `railway.toml` runs `npx prisma migrate deploy && npm start`. |
| **Frontend** | Root **`frontend`**; set **`VITE_API_BASE_URL`** to the **public API origin** (no `/api`); `npm start` serves `dist` on **`PORT`**. |
| **CORS** | Backend **`CLIENT_ORIGIN`** must list the **exact** frontend origin. |

Health check: **`GET /api/health`**.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| **Cannot log in as admin** | Run `npm run db:seed` in `backend`. Ensure email is `admin@example.com` and password `Admin123!` (note `!`). |
| **`Can't reach database server`** | Start Docker Compose (`docker compose up -d`) or fix `DATABASE_URL` / Postgres host. |
| **CORS errors in browser** | Add your frontend origin to `CLIENT_ORIGIN` on the API; no trailing slash issues on origins—match the browser address bar origin. |
| **401 on every API call** | Token missing/expired; log in again. Check `JWT_SECRET` did not change between token issue and verify. |
| **Frontend calls wrong host** | Set `VITE_API_BASE_URL` before **building** the frontend; rebuild after changing it. |

---

## Security & production notes

- Passwords are **never** stored in plain text (bcrypt).
- Use a **long, random** `JWT_SECRET` in production.
- JWTs are stored in **localStorage** here for simplicity; high-security apps often prefer **httpOnly cookies** and CSRF protection.
- **HTTPS** everywhere in production.
- Restrict **CORS** via `CLIENT_ORIGIN` (comma-separated list).

---

## Scripts cheat sheet

| Where | Command | Purpose |
|--------|---------|---------|
| backend | `npm run dev` | API with `node --watch` |
| backend | `npm start` | Production API |
| backend | `npx prisma generate` | Regenerate client after schema change |
| backend | `npm run db:push` | Apply schema to DB (dev-friendly) |
| backend | `npm run db:migrate` | Create migration (typical with Postgres dev DB) |
| backend | `npm run db:migrate:deploy` | Apply migrations (CI / production) |
| backend | `npm run db:seed` | Seed / reset demo users |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production bundle into `dist/` |
| frontend | `npm start` | Serve `dist/` (install deps first) |
| frontend | `npm run preview` | Vite preview of production build |

---

## Author

**Kaustubh Gupta** — this project was **solely** designed and implemented by the author for portfolio, assessment, and learning purposes.

---

## License

MIT — you may use and adapt this project per the license terms; attribution of original authorship is appreciated when sharing publicly.
# ethara.ai
# ethara.ai
