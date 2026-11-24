# Changelog

All notable changes to TaskFlow are documented here. This file follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic-style version numbers.

## [Unreleased]

- No unreleased changes recorded.

## [1.0.0] - 2026-11-24

Initial release: a working full-stack task management application with local development, automated tests, and documentation.

### Added

- **Backend (Flask 3.1.0)**
  - Application factory (`backend/app/__init__.py`) with CORS, JWT, bcrypt, blueprint registration, health endpoint, and centralised error handlers.
  - Environment-driven configuration in `backend/config.py`, with secrets loaded from the root `.env`; production refuses to start without `JWT_SECRET_KEY`.
  - MongoDB connection and automatic index creation in `backend/app/db.py` for `users`, `tasks`, and `revoked_tokens`.
  - Layered request flow: `routes/` → `controllers/` → `services/` → PyMongo collections.
  - Authentication API: register, login, logout with JWT blocklist revocation, current-user lookup/update, and password change.
  - Task API: create, list (search/filter/sort/paginate), read, update, status update, and delete, with all queries scoped by `user_id`.
  - Dashboard statistics endpoint with database-driven overview, breakdowns, recent tasks, and upcoming deadlines.
  - `current_user_id()` middleware helper that verifies the token's account still exists and returns the trusted identity used for ownership checks.
  - Explicit request/query validation and consistent JSON success/error response helpers; serializers strip password hashes and convert ObjectIds.
  - 17 pytest tests using `mongomock`.

- **Frontend (React 18.3.1 + Vite 5.4.x)**
  - Responsive SPA with React Router DOM 6.30.x, Tailwind CSS 3.4.x, Axios, and lucide-react.
  - Pages: Landing, Register, Login, Dashboard, All Tasks, Create Task (plus quick-create modal), Edit Task, Task Details, Profile/settings, and custom 404.
  - Auth, theme (light/dark), and toast context providers; protected routes.
  - API client with bearer-token interceptor and normalised error handling.
  - Loading, empty, error, and success states; delete confirmation; responsive sidebar/mobile drawer.
  - 17 Vitest + Testing Library tests; production build verified.

- **Documentation and repository files**
  - Root `README.md` with setup, commands, API summary, testing, deployment suggestions, and verification checklist.
  - `docs/API_DOCUMENTATION.md` with curl examples for every endpoint.
  - `docs/ARCHITECTURE.md` with layer diagram, request/auth flows, data model, indexes, security decisions, and testing strategy.
  - `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE` (MIT), `.env.example` templates, and `screenshots/README.md` capture checklist.

### Verified locally

- Python 3.14 and Node 24; MongoDB 9 at `127.0.0.1:27017`.
- Register, login, `me`, task create/list/status update/delete, dashboard stats, logout, and token revocation returned expected HTTP results.
- `401` responses for unauthenticated and revoked-token requests.
- `python -m pytest`: 17 passed. `npm test`: 17 passed. `npm run build`: succeeded.

### Fixed during final QA

- Credential errors such as a wrong current password no longer clear the stored JWT; only unusable-session 401 codes do.
- Partial task updates now validate date order against the stored task, preventing an invalid start/due combination via `PUT`.
- Duplicate-email races now return `409 EMAIL_EXISTS` instead of a database error.
- Production config refuses to start without `JWT_SECRET_KEY` even when `ProductionConfig` is selected directly.
- Overdue calculations use UTC on both client and server; `updated_at` is available as a sort option.
- Coverage script now has its `@vitest/coverage-v8` provider installed.

### Notes

- Real-time collaboration (for example Socket.IO) is **not** implemented; the frontend refreshes from the API and syncs local state after mutations.
- Deployment guidance in the README is **suggestions only**; the application has not been deployed.
