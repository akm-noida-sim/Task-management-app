# TaskFlow API documentation

Base URL (local development): **`http://localhost:5000/api`**

The API accepts and returns JSON. Protected endpoints require a JWT access token:

```http
Authorization: Bearer <access_token>
```

All responses follow one of two shapes:

```json
// Success
{ "success": true, "message": "…", "data": { "…": "…" }, "meta": { "…": "…" } }
```

```json
// Error
{ "success": false, "error": { "code": "…", "message": "…", "details": { "…": "…" } } }
```

`message`, `data`, `meta`, and `details` are omitted when not applicable. Object IDs are returned as strings; password hashes are never returned. Date-only fields use `YYYY-MM-DD`. `created_at` / `updated_at` are server-generated timestamps serialised by Flask's JSON provider — examples below use `<timestamp>` as a placeholder.

## Contents

- [Getting started with curl](#getting-started-with-curl)
- [Authentication](#authentication)
  - [POST /auth/register](#post-authregister)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/logout](#post-authlogout)
  - [GET /auth/me](#get-authme)
  - [PUT /auth/me](#put-authme)
  - [POST /auth/change-password](#post-authchange-password)
- [Tasks](#tasks)
  - [POST /tasks](#post-tasks)
  - [GET /tasks](#get-tasks)
  - [GET /tasks/:id](#get-tasksid)
  - [PUT /tasks/:id](#put-tasksid)
  - [PATCH /tasks/:id/status](#patch-tasksidstatus)
  - [DELETE /tasks/:id](#delete-tasksid)
- [Dashboard](#dashboard)
  - [GET /dashboard/stats](#get-dashboardstats)
- [Health](#health)
  - [GET /health](#get-health)
- [Pagination, filtering and sorting](#pagination-filtering-and-sorting)
- [Validation rules](#validation-rules)
- [Status codes and error codes](#status-codes-and-error-codes)
- [JWT behaviour and revocation](#jwt-behaviour-and-revocation)

## Getting started with curl

Set reusable variables in a bash-compatible shell:

```bash
BASE="http://localhost:5000/api"
TOKEN="<access token returned by register or login>"
```

PowerShell note: use `curl.exe` (in Windows PowerShell, `curl` can alias `Invoke-WebRequest`) and keep JSON bodies in single quotes.

## Authentication

### POST /auth/register

Create an account and receive an access token immediately. Public endpoint.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | Yes | 2–80 characters, trimmed |
| `email` | string | Yes | Valid email, ≤ 254 characters, stored lowercase |
| `password` | string | Yes | 8–128 characters, not trimmed |

```bash
curl -s -i -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"StrongPass123"}'
```

**201 Created**

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": "672f1a2b3c4d5e6f708192a3",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Missing/invalid field (e.g. short password) |
| `409` | `EMAIL_EXISTS` | Email already registered |
| `503` | `DATABASE_ERROR` | Database unavailable |

Example validation error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Password must be at least 8 characters.",
    "details": { "password": "Minimum length is 8." }
  }
}
```

### POST /auth/login

Authenticate with email and password. Public endpoint.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Required, ≤ 128 characters |

```bash
curl -s -i -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"StrongPass123"}'
```

**200 OK**

```json
{
  "success": true,
  "message": "Logged in successfully.",
  "data": {
    "user": {
      "id": "672f1a2b3c4d5e6f708192a3",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Missing/invalid email or password |
| `401` | `INVALID_CREDENTIALS` | Unknown email or wrong password |

### POST /auth/logout

Revoke the current access token. Requires JWT. The token's `jti` is stored in `revoked_tokens` until its natural expiry, after which MongoDB's TTL index removes it.

```bash
curl -s -i -X POST "$BASE/auth/logout" \
  -H "Authorization: Bearer $TOKEN"
```

**200 OK**

```json
{ "success": true, "message": "Logged out successfully." }
```

| Status | Error code | Cause |
| --- | --- | --- |
| `401` | `AUTH_REQUIRED` | No token supplied |
| `401` | `INVALID_TOKEN` / `TOKEN_EXPIRED` / `TOKEN_REVOKED` | Token invalid, expired, or already revoked |

### GET /auth/me

Return the account associated with the token. Requires JWT.

```bash
curl -s -i "$BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "672f1a2b3c4d5e6f708192a3",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    }
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `401` | `AUTH_REQUIRED` / `INVALID_TOKEN` / `TOKEN_EXPIRED` / `TOKEN_REVOKED` | Missing or invalid token |
| `401` | `ACCOUNT_NOT_FOUND` | Token identity no longer matches an account |

### PUT /auth/me

Update the account name and/or email. Requires JWT. Supply at least one field.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | No | 2–80 characters, trimmed |
| `email` | string | No | Valid email, ≤ 254 characters, stored lowercase |

```bash
curl -s -i -X PUT "$BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Byron","email":"ada.byron@example.com"}'
```

**200 OK**

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "user": {
      "id": "672f1a2b3c4d5e6f708192a3",
      "name": "Ada Byron",
      "email": "ada.byron@example.com",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    }
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | No updatable field, or invalid field value |
| `409` | `EMAIL_EXISTS` | New email belongs to another account |
| `401` | `ACCOUNT_NOT_FOUND` / auth errors | Identity no longer valid |

### POST /auth/change-password

Change the password after verifying the current one. Requires JWT.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `current_password` | string | Yes | Must match the stored hash |
| `new_password` | string | Yes | 8–128 characters, not trimmed |

```bash
curl -s -i -X POST "$BASE/auth/change-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"StrongPass123","new_password":"EvenStronger456"}'
```

**200 OK**

```json
{ "success": true, "message": "Password changed successfully." }
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Missing/invalid new password |
| `401` | `INVALID_CREDENTIALS` | Current password is incorrect |

## Tasks

Every task is private to the authenticated account. Read/update/delete of another user's task returns `404 TASK_NOT_FOUND` (ownership is not disclosed).

**Task object**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId as hex string |
| `user_id` | string | Owner's ObjectId as string |
| `title` | string | 1–120 characters |
| `description` | string | Up to 2000 characters; default `""` |
| `category` | string | 1–60 characters; default `"General"` |
| `priority` | string | `Low`, `Medium`, `High`; default `Medium` |
| `status` | string | `Pending`, `In Progress`, `Completed`; default `Pending` |
| `start_date` | string or null | `YYYY-MM-DD`; optional |
| `due_date` | string | `YYYY-MM-DD`; required |
| `created_at` | timestamp | Server-generated |
| `updated_at` | timestamp | Server-generated |

### POST /tasks

Create a task. Requires JWT.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `title` | string | Yes | 1–120 characters |
| `due_date` | string | Yes | `YYYY-MM-DD`, on/after `start_date` |
| `description` | string | No | ≤ 2000 characters, default `""` |
| `category` | string | No | 1–60 characters, default `General` |
| `priority` | string | No | `Low` / `Medium` / `High`, default `Medium` |
| `status` | string | No | `Pending` / `In Progress` / `Completed`, default `Pending` |
| `start_date` | string | No | `YYYY-MM-DD` |

Unknown fields are rejected.

```bash
curl -s -i -X POST "$BASE/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Write project documentation",
    "description":"Document the API and architecture.",
    "category":"Work",
    "priority":"High",
    "status":"Pending",
    "start_date":"2026-11-24",
    "due_date":"2026-12-31"
  }'
```

**201 Created**

```json
{
  "success": true,
  "message": "Task created successfully.",
  "data": {
    "task": {
      "id": "672f2b3c4d5e6f708192a4b",
      "user_id": "672f1a2b3c4d5e6f708192a3",
      "title": "Write project documentation",
      "description": "Document the API and architecture.",
      "category": "Work",
      "priority": "High",
      "status": "Pending",
      "start_date": "2026-11-24",
      "due_date": "2026-12-31",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    }
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Missing title/due date, bad enum, bad date, due date before start date, unknown field |
| `401` | auth errors / `ACCOUNT_NOT_FOUND` | Missing/invalid token or deleted account |

### GET /tasks

List the current user's tasks with search, filters, sorting, and pagination. Requires JWT.

**Query parameters**

| Parameter | Default | Rules |
| --- | --- | --- |
| `q` | none | Title search, case-insensitive, ≤ 100 characters |
| `status` | none | `Pending` / `In Progress` / `Completed` |
| `priority` | none | `Low` / `Medium` / `High` |
| `category` | none | Case-insensitive exact match, ≤ 60 characters |
| `sort_by` | `created_at` | `created_at` / `due_date` / `priority` / `title` / `updated_at` |
| `order` | `desc` | `asc` / `desc` |
| `page` | `1` | Integer ≥ 1 |
| `limit` | `10` | Integer 1–100 |

```bash
curl -s -i "$BASE/tasks?q=documentation&status=Pending&priority=High&category=Work&sort_by=due_date&order=asc&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "672f2b3c4d5e6f708192a4b",
        "user_id": "672f1a2b3c4d5e6f708192a3",
        "title": "Write project documentation",
        "description": "Document the API and architecture.",
        "category": "Work",
        "priority": "High",
        "status": "Pending",
        "start_date": "2026-11-24",
        "due_date": "2026-12-31",
        "created_at": "<timestamp>",
        "updated_at": "<timestamp>"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Bad enum, bad sort field/order, `page < 1`, non-integer page/limit, `q` > 100 chars, `category` > 60 chars, `limit` outside 1–100 |

See [Pagination, filtering and sorting](#pagination-filtering-and-sorting) for details.

### GET /tasks/:id

Fetch one task. Requires JWT.

```bash
curl -s -i "$BASE/tasks/672f2b3c4d5e6f708192a4b" \
  -H "Authorization: Bearer $TOKEN"
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "672f2b3c4d5e6f708192a4b",
      "user_id": "672f1a2b3c4d5e6f708192a3",
      "title": "Write project documentation",
      "description": "Document the API and architecture.",
      "category": "Work",
      "priority": "High",
      "status": "Pending",
      "start_date": "2026-11-24",
      "due_date": "2026-12-31",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    }
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `404` | `TASK_NOT_FOUND` | No such task, malformed ID, or task owned by another user |

### PUT /tasks/:id

Update one or more task fields. Requires JWT. Unknown fields are rejected; at least one allowed field must be supplied.

```bash
curl -s -i -X PUT "$BASE/tasks/672f2b3c4d5e6f708192a4b" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Write API documentation","priority":"Medium","due_date":"2026-12-20"}'
```

**200 OK**

```json
{
  "success": true,
  "message": "Task updated successfully.",
  "data": {
    "task": {
      "id": "672f2b3c4d5e6f708192a4b",
      "user_id": "672f1a2b3c4d5e6f708192a3",
      "title": "Write API documentation",
      "description": "Document the API and architecture.",
      "category": "Work",
      "priority": "Medium",
      "status": "Pending",
      "start_date": "2026-11-24",
      "due_date": "2026-12-20",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    }
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Empty/invalid payload, unknown field, due date before start date |
| `404` | `TASK_NOT_FOUND` | No such task, malformed ID, or not owned by the caller |

### PATCH /tasks/:id/status

Update only the status. Requires JWT.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `status` | string | Yes | `Pending` / `In Progress` / `Completed` |

```bash
curl -s -i -X PATCH "$BASE/tasks/672f2b3c4d5e6f708192a4b/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress"}'
```

**200 OK**

```json
{
  "success": true,
  "message": "Task status updated successfully.",
  "data": {
    "task": {
      "id": "672f2b3c4d5e6f708192a4b",
      "user_id": "672f1a2b3c4d5e6f708192a3",
      "title": "Write project documentation",
      "description": "Document the API and architecture.",
      "category": "Work",
      "priority": "High",
      "status": "In Progress",
      "start_date": "2026-11-24",
      "due_date": "2026-12-31",
      "created_at": "<timestamp>",
      "updated_at": "<timestamp>"
    }
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `422` | `VALIDATION_ERROR` | Missing status or invalid status value |
| `404` | `TASK_NOT_FOUND` | No such task, malformed ID, or not owned by the caller |

### DELETE /tasks/:id

Delete a task. Requires JWT.

```bash
curl -s -i -X DELETE "$BASE/tasks/672f2b3c4d5e6f708192a4b" \
  -H "Authorization: Bearer $TOKEN"
```

**200 OK**

```json
{ "success": true, "message": "Task deleted successfully." }
```

| Status | Error code | Cause |
| --- | --- | --- |
| `404` | `TASK_NOT_FOUND` | No such task, malformed ID, or not owned by the caller |

## Dashboard

### GET /dashboard/stats

Get statistics computed from the authenticated user's stored tasks. Requires JWT.

**Response fields**

| Field | Contents |
| --- | --- |
| `overview.total_tasks` | Total tasks |
| `overview.completed_tasks` | Status `Completed` |
| `overview.pending_tasks` | Status `Pending` |
| `overview.in_progress_tasks` | Status `In Progress` |
| `overview.overdue_tasks` | Not completed with `due_date` before today |
| `overview.completion_rate` | Percentage rounded to one decimal (`0` when no tasks) |
| `by_status` | Array of `{name, count}` for all three statuses |
| `by_priority` | Array of `{name, count}` for all three priorities |
| `by_category` | Top six `{name, count}` groups by category |
| `recent_tasks` | Five most recently created task objects |
| `upcoming_deadlines` | Five incomplete tasks with the nearest `due_date` ≥ today |

```bash
curl -s -i "$BASE/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**200 OK** (illustrative numbers)

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_tasks": 4,
      "completed_tasks": 1,
      "pending_tasks": 2,
      "in_progress_tasks": 1,
      "overdue_tasks": 1,
      "completion_rate": 25.0
    },
    "by_status": [
      { "name": "Pending", "count": 2 },
      { "name": "In Progress", "count": 1 },
      { "name": "Completed", "count": 1 }
    ],
    "by_priority": [
      { "name": "Low", "count": 1 },
      { "name": "Medium", "count": 2 },
      { "name": "High", "count": 1 }
    ],
    "by_category": [{ "name": "Work", "count": 3 }, { "name": "General", "count": 1 }],
    "recent_tasks": [],
    "upcoming_deadlines": []
  }
}
```

| Status | Error code | Cause |
| --- | --- | --- |
| `401` | auth errors / `ACCOUNT_NOT_FOUND` | Missing/invalid token or deleted account |
| `503` | `DATABASE_ERROR` | Database unavailable during aggregation |

## Health

### GET /health

Public liveness check. Does not require a database query.

```bash
curl -s -i "$BASE/health"
```

**200 OK**

```json
{
  "success": true,
  "data": { "status": "ok", "service": "taskflow-api" }
}
```

Unknown routes and wrong methods use the standard error shape too, e.g. `404 ROUTE_NOT_FOUND` or `405 METHOD_NOT_ALLOWED`.

## Pagination, filtering and sorting

- Every query starts from `{ "user_id": <caller's ObjectId> }`; filters are added on top, so results are always private to the caller.
- `q` performs a case-insensitive, escaped regex search on `title`.
- `category` is a case-insensitive exact-style match.
- `status` and `priority` are exact enum matches.
- `sort_by` maps to stored fields: `created_at`, `updated_at`, `due_date`, `title`, and `priority` (sorted by an internal `priority_rank`: Low = 1, Medium = 2, High = 3).
- `order` defaults to `desc`; `asc` reverses the chosen sort field.
- `page` defaults to 1 and must be ≥ 1. `limit` defaults to 10 and must be between 1 and 100.
- If `page` exceeds `total_pages`, the last page is returned. `total_pages` is `0` when there are no tasks.
- `meta` is only present on the task-list endpoint.

## Validation rules

| Area | Rule |
| --- | --- |
| Registration | `name` 2–80; `email` valid, ≤ 254, lowercased; `password` 8–128 |
| Login | `email` valid; `password` required, ≤ 128 |
| Profile update | At least one of `name` (2–80) or `email` (valid, ≤ 254, lowercased) |
| Password change | `current_password` required; `new_password` 8–128 |
| Task create | `title` 1–120 required; `description` ≤ 2000 default `""`; `category` 1–60 default `General`; `priority` enum default `Medium`; `status` enum default `Pending`; `start_date` optional `YYYY-MM-DD`; `due_date` required `YYYY-MM-DD` |
| Task update | Partial: at least one allowed field; same field rules apply to supplied fields |
| Status update | `status` required and one of the three allowed values |
| Dates | `YYYY-MM-DD`; `due_date` must be on or after `start_date` |
| Unknown fields | Task payloads reject extras with `422 VALIDATION_ERROR`; account payloads ignore extras (nothing unknown is stored) |
| Query string | `q` ≤ 100; `category` ≤ 60; enums exact; `sort_by`/`order` restricted; `page` integer ≥ 1; `limit` integer 1–100 |

## Status codes and error codes

| Code | Meaning |
| --- | --- |
| `200` | Successful GET/PUT/PATCH/POST that does not create a resource |
| `201` | Resource created (register, task create) |
| `400` | Malformed request (`BAD_REQUEST`) |
| `401` | Missing/invalid/expired/revoked token or bad credentials |
| `404` | Resource not found, or not owned by the caller (`TASK_NOT_FOUND`) |
| `409` | Conflict, e.g. duplicate email (`EMAIL_EXISTS`) |
| `415` | Unsupported media type (`UNSUPPORTED_MEDIA_TYPE`) |
| `422` | Validation failure (`VALIDATION_ERROR`) |
| `503` | Database unavailable (`DATABASE_ERROR`) |
| `500` | Unexpected error (`INTERNAL_ERROR`) |

| Error code | Typical source |
| --- | --- |
| `AUTH_REQUIRED` | No `Authorization` header on a protected route |
| `INVALID_TOKEN` | Signature/format invalid |
| `TOKEN_EXPIRED` | Access token past its expiry |
| `TOKEN_REVOKED` | Token was logged out (present in blocklist) |
| `FRESH_TOKEN_REQUIRED` | JWT loader requiring a fresh token |
| `INVALID_CREDENTIALS` | Wrong login credentials or current password |
| `ACCOUNT_NOT_FOUND` | Token identity does not match an existing account |
| `INVALID_IDENTITY` | Identity cannot be converted to an ObjectId |
| `EMAIL_EXISTS` | Duplicate registration/profile email |
| `VALIDATION_ERROR` | Payload or query validation failed |
| `TASK_NOT_FOUND` | Missing task, malformed ID, or foreign task |
| `DATABASE_ERROR` | PyMongo failure |
| `INTERNAL_ERROR` | Unhandled exception; details are logged server-side, never returned |

Forbidden-by-ownership is deliberately reported as `404 TASK_NOT_FOUND` rather than `403`, so clients cannot probe which task IDs exist.

## JWT behaviour and revocation

1. Register or login returns `data.access_token`; the frontend stores it under the `taskflow.token` localStorage key.
2. Send it on every protected call as `Authorization: Bearer <token>`.
3. The API verifies signature and expiry with Flask-JWT-Extended and checks the blocklist loader registered in the app factory.
4. Protected controllers call `jwt_required()` and then `current_user_id()`, which confirms the account still exists and returns the trusted user ID used for all ownership checks.
5. `POST /auth/logout` records the token's `jti` and expiry in `revoked_tokens`; a TTL index removes the record after expiry. Subsequent calls with that token return `401 TOKEN_REVOKED`.
6. Token lifetime is controlled by `JWT_ACCESS_TOKEN_HOURS` (default 24). There are no refresh tokens in this release.
