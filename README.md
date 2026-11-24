# TaskFlow

**TaskFlow** is a full-stack task management application: a responsive React 18 + Vite frontend backed by a Flask 3 REST API and MongoDB. It supports authenticated accounts, CRUD task management with filtering/sorting/pagination, and a database-driven dashboard. Everything in this repository runs locally; deployment instructions in section 19 are **suggestions only** — the project has not been deployed.

Repository: https://github.com/akm-noida-sim/Task-management-application.git

---

## Table of contents

1. [Title / introduction](#1-title--introduction)
2. [Description](#2-description)
3. [Problem statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Features](#5-features)
6. [Technology stack](#6-technology-stack)
7. [Architecture](#7-architecture)
8. [Folder structure](#8-folder-structure)
9. [Screenshots](#9-screenshots)
10. [Prerequisites](#10-prerequisites)
11. [Step-by-step local installation](#11-step-by-step-local-installation)
12. [Backend setup](#12-backend-setup)
13. [Frontend setup](#13-frontend-setup)
14. [MongoDB configuration](#14-mongodb-configuration)
15. [Environment configuration](#15-environment-configuration)
16. [API documentation](#16-api-documentation)
17. [How to run](#17-how-to-run)
18. [Testing](#18-testing)
19. [Deployment](#19-deployment)
20. [Future enhancements](#20-future-enhancements)
21. [Learning outcomes](#21-learning-outcomes)
22. [Author](#22-author)
23. [License](#23-license)
- [Suggested Git commit history](#suggested-git-commit-history)
- [Verification checklist](#verification-checklist)

---

## 1. Title / introduction

TaskFlow is a practical, self-hosted task manager built to demonstrate a clean separation between a modern single-page frontend and a layered Python API. A user registers, signs in, and gets a private workspace: tasks can be created, filtered, updated, re-prioritised, and deleted, while the dashboard summarises progress from the same stored data.

- Frontend runs at **http://localhost:5173**
- Backend API runs at **http://localhost:5000/api**
- Health check: `GET http://localhost:5000/api/health`

## 2. Description

The application consists of two independent projects in one repository:

| Project | Directory | Role |
| --- | --- | --- |
| Frontend | `frontend/` | React 18 single-page app (Vite, Tailwind CSS, React Router DOM, Axios, lucide-react) |
| Backend | `backend/` | Flask 3 REST API (JWT auth, bcrypt hashing, PyMongo) with a `routes → controllers → services → collections` layering |
| Documentation | `docs/`, `screenshots/` | API reference, architecture notes, screenshot placeholders |

The frontend never talks to MongoDB directly. All data access goes through JSON over `/api`, with a JWT bearer token attached by an Axios request interceptor.

## 3. Problem statement

Task tracking tools are often either too heavy (accounts, setup, and infrastructure just to note a few tasks) or too loose (a local list with no history, no structure, and no way to see progress). A useful middle ground needs to be simple to run on a laptop, secure enough for per-user private data, and structured enough that both the UI and an external API client can rely on predictable responses.

TaskFlow addresses this by providing:

- private, per-user task storage enforced in the data-access layer;
- a consistent JSON contract for every success and error;
- a small, readable codebase where each layer has one responsibility;
- a real dashboard computed from stored tasks rather than hard-coded numbers.

## 4. Objectives

1. Build a working full-stack application with separate frontend and backend processes.
2. Implement register / login / logout with hashed passwords and revocable JWT access tokens.
3. Provide complete task CRUD plus a fast status-update endpoint.
4. Support search, filtering, sorting, and server-side pagination.
5. Keep API responses and errors consistent for all clients.
6. Make privacy structural: every task query is scoped by the authenticated `user_id`.
7. Cover the code with automated tests that need no external database (backend) and run headlessly (frontend).
8. Document setup, API, architecture, and contribution workflow so another developer can start quickly.

## 5. Features

### Accounts and security
- Registration, login, and `GET /api/auth/me` session validation.
- Bcrypt password hashing; plaintext passwords are never stored.
- JWT access tokens (`Authorization: Bearer …`) with configurable lifetime (`JWT_ACCESS_TOKEN_HOURS`, default 24).
- Protected controllers use `jwt_required()`; the app factory registers a JWT blocklist loader; `current_user_id()` middleware confirms the token's account still exists before any ownership check.
- Logout revokes the token via a `revoked_tokens` collection with a MongoDB TTL index.
- Profile update (name / email) and password change with current-password verification.
- Production refuses to start without `JWT_SECRET_KEY`.

### Tasks
- Create, list, read, update, and delete tasks; dedicated `PATCH /tasks/:id/status`.
- Task fields: `title`, `description`, `category`, `priority`, `status`, `start_date`, `due_date`.
- Statuses: **Pending**, **In Progress**, **Completed**. Priorities: **Low**, **Medium**, **High**.
- Dates use `YYYY-MM-DD`; due date cannot be earlier than start date.
- Search by title (`q`), filter by status / priority / category, sort by creation date, due date, priority, title, or update time, with `asc`/`desc` order.
- Pagination with `page` and `limit` (max 100, default 10), including `total`, `total_pages`, `has_next`, `has_prev`.

### User interface
- Pages: Landing, Register, Login, Dashboard, All Tasks, Create Task (plus a quick-create modal), Edit Task, Task Details, Profile/settings, and a custom 404.
- Responsive sidebar that becomes a mobile drawer on small screens.
- Light/dark mode.
- Loading, empty, error, and success states; toast notifications; delete confirmation dialogs.
- The frontend refreshes data from the API after mutations and keeps local state in sync. **Real-time updates (e.g. Socket.IO) are not implemented.**

### Quality
- 17 backend tests using `pytest` + `mongomock` (no MongoDB server required).
- 17 frontend tests using Vitest + Testing Library.
- Production build verified with `npm run build`.

## 6. Technology stack

| Area | Technology | Version / note |
| --- | --- | --- |
| Frontend framework | React | 18.3.1 |
| Frontend build tool | Vite | 5.4.x |
| Styling | Tailwind CSS | 3.4.x (with PostCSS + Autoprefixer) |
| Routing | React Router DOM | 6.30.x |
| HTTP client | Axios | bearer-token interceptor |
| Icons | lucide-react | — |
| Backend framework | Flask | 3.1.0 (Flask-RESTful pinned) |
| Auth | Flask-JWT-Extended | 4.7.1 |
| CORS | Flask-CORS | 6.0.0 |
| Password hashing | Flask-Bcrypt | 1.0.1 |
| Environment loading | python-dotenv | 1.1.0 |
| Database driver | PyMongo | 4.12.0 (+ dnspython for Atlas SRV) |
| Database | MongoDB | 9 locally; Atlas supported |
| Runtimes | Python / Node | Python 3.14 used locally; Node 24 |
| Backend tests | pytest / mongomock | 8.3.5 / 4.3.0 |
| Frontend tests | Vitest / Testing Library | 2.1.9 / `@testing-library/react` |

## 7. Architecture

```
Browser (React SPA, http://localhost:5173)
        │  JSON over HTTPS/HTTP, Authorization: Bearer <JWT>
        ▼
Flask app factory (backend/app/__init__.py)  ── CORS, JWT, bcrypt, JWT blocklist loader, error handlers
        │
        ▼
routes/  (URL → controller mapping, /api prefix)
        │
        ▼
controllers/  (jwt_required, request parsing, validation, response shaping)
        │
        ▼
middleware/  (current_user_id(): confirm account, return trusted user id)
        │
        ▼
services/  (per-query user_id scoping, hashing, token revocation, stats)
        │
        ▼
PyMongo collections: users · tasks · revoked_tokens  (MongoDB 9 / Atlas)
```

Configuration comes from `backend/config.py` (environment variables), `app/utils/errors.py` centralises JSON error handling, `app/utils/responses.py` produces consistent success/error shapes, and `app/utils/serializers.py` strips password hashes and converts ObjectIds. Authentication is enforced in four steps: `jwt_required()` on protected controllers, the JWT blocklist loader registered in the app factory, the `current_user_id()` middleware helper that verifies the token's account still exists, and `user_id` scoping on every service query.

For the full request lifecycle, data model, indexes, security decisions, and deployment diagram, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 8. Folder structure

```
Task-management-application/
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE                     # MIT
├── .gitignore                  # ignores .env, node_modules, __pycache__, dist, …
├── .env.example                # backend + shared variables template
├── docs/
│   ├── API_DOCUMENTATION.md
│   └── ARCHITECTURE.md
├── screenshots/
│   └── README.md               # screenshots to capture
├── backend/
│   ├── config.py               # env-driven configuration classes
│   ├── run.py                  # local development entry point
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── __init__.py         # create_app() application factory
│   │   ├── db.py               # MongoClient, collections, indexes
│   │   ├── routes/             # auth_routes, tasks_routes, dashboard_routes
│   │   ├── controllers/        # request/response layer, jwt_required()
│   │   ├── middleware/         # auth.py: current_user_id() identity helper
│   │   ├── services/           # auth_service, task_service
│   │   ├── models/             # schemas.py (validation)
│   │   └── utils/              # errors.py, responses.py, serializers.py
│   └── tests/                  # pytest + mongomock
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example            # VITE_API_BASE_URL
    ├── public/
    └── src/
        ├── App.jsx             # routes and providers
        ├── main.jsx
        ├── index.css
        ├── assets/
        ├── components/
        ├── pages/
        ├── layouts/
        ├── context/            # auth, theme, toast
        ├── hooks/
        ├── services/           # api client, auth/task/dashboard services
        ├── utils/
        └── tests/              # Vitest + Testing Library
```

## 9. Screenshots

Screenshot files are **placeholders to be captured**; the PNGs are not committed yet. See [screenshots/README.md](screenshots/README.md) for the capture checklist.

| Screenshot | Path | Shows |
| --- | --- | --- |
| Dashboard | [`screenshots/dashboard.png`](screenshots/dashboard.png) | Stat cards, charts, recent tasks, upcoming deadlines |
| All tasks | [`screenshots/tasks.png`](screenshots/tasks.png) | Filter bar, task table/cards, pagination |
| Login | [`screenshots/login.png`](screenshots/login.png) | Sign-in form and public layout |
| Mobile view | [`screenshots/mobile.png`](screenshots/mobile.png) | Responsive layout with the mobile navigation drawer |

```markdown
![Dashboard](screenshots/dashboard.png)
```

Replace each placeholder image with a real capture before publishing a release.

## 10. Prerequisites

| Requirement | Version used locally | Notes |
| --- | --- | --- |
| Python | 3.14 | Backend; 3.x with modern typing is expected |
| Node.js / npm | Node 24 | Frontend tooling |
| MongoDB | 9 on `127.0.0.1:27017` | Or a MongoDB Atlas cluster |
| Git | any recent version | To clone the repository |
| Terminal | PowerShell (Windows) or bash/zsh (Unix) | Commands below show both |

No global installs of Flask, Vite, or pytest are required; use a virtual environment and local npm packages.

## 11. Step-by-step local installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/akm-noida-sim/Task-management-application.git
   cd Task-management-application
   ```

2. **Create the root `.env` from the template** (never edit `.env.example` with real secrets)

   ```powershell
   Copy-Item .env.example .env
   ```
   ```bash
   cp .env.example .env
   ```

3. **Start MongoDB locally** (or point `MONGODB_URI` at Atlas — see section 14). The verified local setup is MongoDB 9 listening on `127.0.0.1:27017`.

4. **Set up the backend** — see section 12.

5. **Set up the frontend** — see section 13.

6. **Confirm the frontend env file** by copying `frontend/.env.example` to `frontend/.env` (the API base URL defaults to `http://localhost:5000/api` if omitted).

7. **Run both servers** in separate terminals — see section 17.

8. **Verify** with `GET http://localhost:5000/api/health` and by opening `http://localhost:5173`.

## 12. Backend setup

Run these commands **from the `backend/` directory**:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements-dev.txt
```

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

`requirements-dev.txt` includes `requirements.txt` (Flask 3.1.0, Flask-RESTful pinned, Flask-JWT-Extended 4.7.1, Flask-CORS 6.0.0, Flask-Bcrypt 1.0.1, python-dotenv 1.1.0, PyMongo 4.12.0, dnspython) plus pytest 8.3.5, pytest-cov, and mongomock 4.3.0. For a runtime-only install use `pip install -r requirements.txt`.

Start the API with `python run.py` (section 17). The API is served at `http://localhost:5000/api`. Indexes are created automatically at startup by `app/db.py`.

## 13. Frontend setup

Run these commands **from the `frontend/` directory**:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` contains only `VITE_API_BASE_URL` (default `http://localhost:5000/api`). Start the dev server with `npm run dev`; it listens on port **5173**.

Other scripts:

```bash
npm run build       # production bundle in frontend/dist
npm run preview     # preview the built bundle
npm test            # run the Vitest suite once
npm run test:watch  # watch mode
```

## 14. MongoDB configuration

### Local MongoDB (verified setup)

Use the default connection string in the root `.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=taskflow
```

MongoDB 9 was verified locally on `127.0.0.1:27017`. Ensure the daemon is running before `python run.py`; otherwise database operations return `503 DATABASE_ERROR` (health endpoint itself does not query the database).

### MongoDB Atlas

1. Create a cluster and a database user; allow your IP in Network Access.
2. Get the SRV connection string and put it in the root `.env` (include the password, URL-encoded if it contains special characters):

   ```dotenv
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=taskflow
   ```

3. `dnspython` is already pinned in `requirements.txt`, so SRV URIs resolve correctly.
4. Restart the backend so `init_db()` recreates indexes on the new database.

Never commit the URI with real credentials.

## 15. Environment configuration

Copy `.env.example` → `.env` at the repository root and `frontend/.env.example` → `frontend/.env`. `.gitignore` excludes real `.env` files; **never commit `.env`**.

### Root `backend/` variables (root `.env`)

| Variable | Example | Purpose |
| --- | --- | --- |
| `FLASK_ENV` | `development` | `development` / `production` / `testing`; controls debug mode |
| `FLASK_APP` | `run.py` | Flask entry point hint |
| `HOST` | `0.0.0.0` | Bind address used by `run.py` |
| `PORT` | `5000` | Backend port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | Local MongoDB or Atlas SRV URI |
| `MONGODB_DB_NAME` | `taskflow` | Database name |
| `JWT_SECRET_KEY` | long random string | Signs tokens; **required when `FLASK_ENV=production`** |
| `JWT_ACCESS_TOKEN_HOURS` | `24` | Access token lifetime (minimum 1 hour) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed frontend origins, no trailing slash |

Generate a strong secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

When `FLASK_ENV=production`, the app raises a `RuntimeError` at startup if `JWT_SECRET_KEY` is missing or empty. In development a clearly labelled fallback secret is used so the app can run without setup.

### Frontend variables (`frontend/.env`)

| Variable | Example | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL for all Axios requests; no trailing slash |

## 16. API documentation

Full reference with `curl` examples for every endpoint: **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)**.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Create an account; returns user + access token (`201`) |
| `POST` | `/api/auth/login` | No | Authenticate; returns user + access token |
| `POST` | `/api/auth/logout` | JWT | Revoke the current access token |
| `GET` | `/api/auth/me` | JWT | Get the current user |
| `PUT` | `/api/auth/me` | JWT | Update name and/or email |
| `POST` | `/api/auth/change-password` | JWT | Change password after verifying the current one |
| `POST` | `/api/tasks` | JWT | Create a task (`201`) |
| `GET` | `/api/tasks` | JWT | List tasks with search, filters, sorting, pagination |
| `GET` | `/api/tasks/:id` | JWT | Get one task |
| `PUT` | `/api/tasks/:id` | JWT | Update task fields |
| `PATCH` | `/api/tasks/:id/status` | JWT | Update only the status |
| `DELETE` | `/api/tasks/:id` | JWT | Delete a task |
| `GET` | `/api/dashboard/stats` | JWT | Aggregated dashboard statistics |
| `GET` | `/api/health` | No | Liveness check |

Success responses use `{"success": true, "message": …, "data": …, "meta": …}`; errors use `{"success": false, "error": {"code", "message", "details"}}`. Protected endpoints expect `Authorization: Bearer <access_token>`.

## 17. How to run

**Terminal 1 — backend** (from `backend/`, with the virtual environment activated):

```powershell
python run.py
```
```bash
python run.py
```

**Terminal 2 — frontend** (from `frontend/`):

```powershell
npm run dev
```
```bash
npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API base | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

Use the UI to register and sign in, or call the API directly with `curl` (see the API docs). For a production-style local check: `npm run build` in `frontend/` creates `frontend/dist/`.

## 18. Testing

### Backend — 17 tests, mongomock (no database server needed)

From `backend/`, with the dev virtual environment active:

```bash
python -m pytest
```

`backend/pytest.ini` discovers `tests/test_*.py`. `tests/conftest.py` builds the app with `create_app(TestingConfig, mongo_client=mongomock.MongoClient())`, so tests are isolated and fast (bcrypt rounds reduced to 4 in `TestingConfig`). All **17 backend tests pass**.

### Frontend — 17 tests, Vitest + Testing Library

From `frontend/`:

```bash
npm test
```

All **17 frontend tests pass** in the jsdom environment configured in `vite.config.js`. Watch and coverage modes are available via `npm run test:watch` and `npm run test:coverage`.

### Build verification

```bash
cd frontend && npm run build
```

The production build completes successfully and outputs to `frontend/dist/`.

## 19. Deployment

> **Status: suggestions only — TaskFlow is not deployed.** No live frontend, backend, or hosted database is configured by this repository.

A straightforward, low-cost setup would be:

| Piece | Suggested service | Configuration |
| --- | --- | --- |
| Frontend | Vercel | Project root `frontend`, build command `npm run build`, output `dist`, environment variable `VITE_API_BASE_URL` pointing to the backend `/api` |
| Backend | Render | Runtime **Python**, build `pip install -r requirements.txt`, start `cd backend && python run.py` or `gunicorn "run:app"`; set the root env vars from section 15 |
| Database | MongoDB Atlas | Use the SRV URI in `MONGODB_URI`; Network Access must allow the backend host |
| CORS | Backend env | Set `CORS_ORIGINS` to the deployed Vercel URL (no trailing slash) |

Production notes: set `FLASK_ENV=production` and a strong `JWT_SECRET_KEY` (the app refuses to start without it), use HTTPS for both origins, and never commit `.env` or Atlas credentials. A Gunicorn command assumes Gunicorn is installed in that environment; it is not in `requirements.txt`.

## 20. Future enhancements

These are ideas, not implemented features:

- Optional real-time collaboration (Socket.IO or SSE) with a shared cache/invalidation strategy; current behaviour is API refresh plus local state sync.
- Email/password reset and optional OAuth login.
- Subtasks, tags, attachments, recurring tasks, and drag-and-drop reordering.
- Deadline reminders/notifications.
- Saved filters and per-user views.
- Export to CSV/JSON and broader reporting charts.
- CI pipeline running both test suites and the production build.
- Rate limiting and audit logs for sensitive account actions.

## 21. Learning outcomes

- Designing a REST API with a layered codebase (`routes → controllers → services → collections`) and an application factory.
- Layering authorization with `jwt_required()`, a JWT blocklist loader, a middleware identity helper, and `user_id` scoping of every task query in services.
- Implementing JWT authentication, bcrypt hashing, and server-side token revocation with a TTL index.
- Building a responsive SPA with React Router, context providers, and an Axios interceptor.
- Creating predictable success/error contracts, validation, pagination, filtering, and sorting across client and server.
- Writing isolated backend tests with `mongomock` and component tests with Vitest/Testing Library.
- Documenting a project for handoff, contribution, and future deployment.

## 22. Author

**TaskFlow contributors**

Source repository: https://github.com/akm-noida-sim/Task-management-application.git

## 23. License

Released under the **MIT License**. See [LICENSE](LICENSE) for the full text.

Copyright (c) 2026 TaskFlow contributors.

---

## Suggested Git commit history

The repository currently has **no commits yet**, so the history below is a *suggested* sequence rather than a record of what exists. One possible way to build it:

```bash
git init                                   # if not already initialised
git add .gitignore .env.example LICENSE README.md
git commit -m "chore: initialise repository with license and env template"

git add backend/config.py backend/run.py backend/requirements.txt backend/requirements-dev.txt backend/pytest.ini
git commit -m "feat(backend): add Flask app factory and env-driven config"

git add backend/app/db.py backend/app/utils backend/app/models
git commit -m "feat(backend): add Mongo collections, indexes and JSON helpers"

git add backend/app/services backend/app/controllers backend/app/routes
git commit -m "feat(backend): implement auth, task CRUD and dashboard API"

git add backend/tests
git commit -m "test(backend): add 17 mongomock-backed API tests"

git add frontend
git commit -m "feat(frontend): add React SPA, routing, pages and API client"

git add frontend/src/tests
git commit -m "test(frontend): add 17 Vitest and Testing Library tests"

git add CONTRIBUTING.md CHANGELOG.md docs screenshots
git commit -m "docs: add contribution guide, changelog, API docs and architecture"
```

Follow the commit message conventions in [CONTRIBUTING.md](CONTRIBUTING.md).

## Verification checklist

Use this to confirm a fresh setup matches what was verified locally.

- [ ] MongoDB 9 is running on `127.0.0.1:27017` (or Atlas `MONGODB_URI` is set and reachable).
- [ ] Root `.env` exists, is derived from `.env.example`, and is **not** tracked by Git.
- [ ] `frontend/.env` exists with `VITE_API_BASE_URL=http://localhost:5000/api` (or the deployed API URL).
- [ ] Backend virtual environment created; `pip install -r requirements-dev.txt` succeeded.
- [ ] `python run.py` from `backend/` starts the API at `http://localhost:5000/api`.
- [ ] `GET /api/health` returns `{"success": true, "data": {"status": "ok", "service": "taskflow-api"}}`.
- [ ] `npm install` and `npm run dev` start the SPA at `http://localhost:5173`.
- [ ] Register → Login → `GET /api/auth/me` all return the expected success payloads.
- [ ] Task create, list, status update, dashboard stats, and delete return the expected results.
- [ ] Logout revokes the token; the same token then returns `401 TOKEN_REVOKED`.
- [ ] Unauthenticated requests to protected endpoints return `401 AUTH_REQUIRED`.
- [ ] A second user cannot read or modify the first user's tasks (`404 TASK_NOT_FOUND`).
- [ ] Duplicate registration returns `409 EMAIL_EXISTS`; invalid payloads return `422 VALIDATION_ERROR`.
- [ ] `python -m pytest` from `backend/`: **17 passed**.
- [ ] `npm test` from `frontend/`: **17 passed**.
- [ ] `npm run build` from `frontend/` completes successfully.
- [ ] Light/dark mode and the mobile navigation drawer work at a narrow viewport.
- [ ] Screenshot placeholders in `screenshots/` are replaced with real captures before release.
