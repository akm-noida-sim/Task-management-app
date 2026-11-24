# Contributing to TaskFlow

Thank you for taking the time to contribute. This document covers how to set up a development environment, follow the project's conventions, and submit changes safely.

## 1. Before you start

- Read the [README](README.md) for setup and project layout.
- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing request flow, auth, or database access.
- Keep changes focused. One pull request should solve one problem or add one coherent capability.
- Do not commit real credentials, `.env` files, access tokens, or database dumps.

## 2. Local setup

```bash
git clone https://github.com/akm-noida-sim/Task-management-application.git
cd Task-management-application
cp .env.example .env
```

Backend:

```bash
cd backend
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# Unix:    source .venv/bin/activate
pip install -r requirements-dev.txt
python run.py
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

MongoDB should be reachable at the URI in `MONGODB_URI` (default `mongodb://127.0.0.1:27017`).

## 3. Branching

- Create a branch from the default working branch.
- Use a short, descriptive name:

| Prefix | Use |
| --- | --- |
| `feat/...` | New feature |
| `fix/...` | Bug fix |
| `docs/...` | Documentation only |
| `test/...` | Tests only |
| `refactor/...` | Internal refactor with no behaviour change |
| `chore/...` | Tooling, deps, housekeeping |

Examples: `feat/task-due-reminders`, `fix/status-validation`, `docs/api-examples`.

## 4. Commit messages

Follow a Conventional Commits style where practical:

```
<type>(<scope>): <short summary>
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`. Scope is optional (`backend`, `frontend`, `api`, `auth`, `tasks`, `docs`).

Good examples:

- `feat(tasks): add category filter to task list`
- `fix(auth): return 401 for revoked token`
- `test(frontend): cover login error state`
- `docs(api): add curl examples for task endpoints`

Keep the subject imperative and specific. Avoid "update stuff" / "fix bug".

## 5. Code style and project conventions

### General
- Match the surrounding style; do not reformat unrelated files.
- Prefer small, readable functions over clever abstractions.
- Do not invent API fields or UI features that the backend does not support.

### Backend (Python / Flask)
- Keep the layer boundaries: **routes → controllers → services → PyMongo collections**.
- Routes map URLs to controllers only.
- Controllers handle `jwt_required()`, parse/validate input, call `current_user_id()` for protected identity, call services, and return `app.utils.responses.success/error` shapes.
- Services contain business rules and database access. Every task query must be scoped by `user_id`.
- Validation belongs in `app/models/schemas.py`; keep messages predictable.
- Use domain errors from `app.utils.errors` (`ValidationError`, `UnauthorizedError`, `NotFoundError`, `ConflictError`) rather than returning ad-hoc dicts.
- Never expose password hashes, stack traces, or raw database errors to clients.

### Frontend (React / Vite / Tailwind)
- Use functional components and hooks.
- Keep API calls in `src/services/`; components should not build raw Axios URLs.
- Use existing context/providers for auth, theme, and toasts.
- Preserve responsive behaviour (mobile drawer, desktop sidebar) and light/dark mode.
- Keep loading, empty, error, and success states visible and accessible.

## 6. Tests

Run tests before opening a pull request.

Backend (from `backend/`, venv active):

```bash
python -m pytest
```

Frontend (from `frontend/`):

```bash
npm test
npm run build
```

Guidelines:

- Add or update tests for behaviour changes.
- Backend tests use `mongomock` through `tests/conftest.py`; do not require a live MongoDB server.
- Frontend tests use Vitest + Testing Library in jsdom.
- If you fix a bug, add a regression test when practical.

## 7. Documentation

Update documentation when you change behaviour:

- `README.md` for setup, commands, feature summaries, or structure.
- `docs/API_DOCUMENTATION.md` for endpoint/request/response changes.
- `docs/ARCHITECTURE.md` for flow, data model, auth, or deployment-impacting decisions.
- `CHANGELOG.md` for user-visible or developer-relevant changes.

## 8. Pull request checklist

Before requesting review, confirm:

- [ ] The change is scoped and explained clearly.
- [ ] Branch name and commit messages are descriptive.
- [ ] No secrets, `.env` files, tokens, or personal data are included.
- [ ] Backend tests pass: `python -m pytest` (from `backend/`).
- [ ] Frontend tests pass: `npm test` (from `frontend/`).
- [ ] Frontend build passes: `npm run build` (from `frontend/`).
- [ ] New/changed endpoints keep the standard success/error response shape.
- [ ] Task queries remain scoped by `user_id`.
- [ ] Protected routes still require `jwt_required()` and use `current_user_id()` where appropriate.
- [ ] Docs/screenshots were updated if behaviour or UI changed.
- [ ] The PR description includes what changed, why, and how it was tested.

## 9. Reporting bugs / requesting features

Open an issue with enough detail to reproduce or evaluate:

- Bug: steps to reproduce, expected result, actual result, environment (OS, Python, Node, MongoDB), and relevant logs or response bodies (redact secrets).
- Feature: problem being solved, proposed behaviour, API/UI impact, and any tradeoffs.

Redact secrets and tokens from any logs or response bodies included in an issue.
