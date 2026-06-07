# Watchtower Backend

Watchtower is an error monitoring platform. The backend side receives events from the Watchtower SDK, stores them in a database for the Dashboard team to display on frontend. 

---

## Backend Requirements

At a high level, the backend must do three things:

1. **Ingests events** — The SDK (running in a customer's browser) sends
   batches of error, log, and performance events via HTTP POST. The
   backend validates them and writes them to the database.

2. **Stores data** — All events and project metadata are stored in a
   Cloudflare D1 database.

3. **Serves the Dashboard** — The Dashboard reads errors, filters them,
   and marks them as resolved via a read/write REST API.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Language | JavaScript (ES Modules) |
| Config | `wrangler.toml` |
| Tests | TBD (ViTest) |

---

## Prerequisites

- [Node.js](https://nodejs.org) (v18 or later)
- A Cloudflare account
- The Wrangler CLI

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Entry point — routing and CORS
│   ├── middleware/
│   │   └── auth.js           # API key validation, user and project creation
│   ├── routes/
│   │   ├── ingest.js         # POST /ingest/* — error, log, performance
│   │   ├── errors.js         # GET/PATCH /api/errors
│   │   ├── logs.js           # GET /api/logs
│   │   ├── performance.js    # GET /api/performance
│   │   ├── projects.js       # GET /api/projects
│   │   └── notifications.js  # GET/POST /api/notifications/settings
│   ├── storage/
│   │   └── d1.js             # All D1 SQL operations
│   └── cron/
│       └── digest.js         # Daily email digest cron job
├── migrations/               # SQL migration files
├── schema.sql                # Base database schema
├── wrangler.toml             # Cloudflare Worker configuration
└── test/                     # Vitest integration tests
```plaintext

### Network Requests

```
HTTP Request
     │
     ▼
src/index.js             ← decides which route handles the request
     │
     ├── /ingest/*     → src/routes/ingest.js     ← validates + stores events
     ├── /api/errors   → src/routes/errors.js     ← reads/updates errors
     ├── /api/projects → src/routes/projects.js   ← lists projects for a user
     │
     ▼
src/middleware/auth.js   ← validates api_key on every request
     │
     ▼
src/storage/d1.js        ← executes SQL against the D1 database
```

---

## Architecture Notes

### Separation of Concerns

Codebase layers:

- **`index.js`** — Use for routing purposes. Reads URL path and 
  delegates to appropriate route handler.
- **`routes/`** —  Controls request/response logic. Each file handles one
  domain (ingestion, errors, projects). Route handlers validate input,
  call auth middleware, call storage functions, and return responses.
- **`middleware/auth.js`** — Controls identitification. All API key lookups, user
  creation, and project creation are managed via auth.js.
- **`storage/d1.js`** — Database control. All SQL queries are managed in this file.

### Project Isolation

Every database query is scoped by `api_key`. A project can never read,
update, or enumerate another project's data. When an error is not found
or belongs to a different project, `404` response is received, thus ownership cannot be inferred by an outside caller.

### Validation Strategy

Ingest requests go through two sequential loops before any database
write occurs:

1. **Validation loop** — every event in the batch is checked against the
   required fields for its endpoint. If any event fails, the request is
   rejected immediately with a `400` and no data is written.
2. **Storage loop** — runs if all events pass. Each event is written
   individually to D1.

These steps ensures the database does not receive a partial batch from a
inappropriate request.

### CORS

All responses include CORS headers that allow requests from any origin.
This is required as SDK runs inside a customer's browser
domain outside of Watchtower's control.

---

## Authentication

Every request must include a valid `api_key`It's destination is controlled by the request type.


| Request type | Where to put `api_key` |
|--------------|------------------------|
| `POST /ingest/*` | Inside the JSON body |
| `GET /api/errors` | Query parameter `?api_key=` |
| `PATCH /api/errors/:id` | Query parameter `?api_key=` |

API keys are generated via `POST /api/key_generate` and stored in the
`projects` table. They follow the format `wt_<random string>`.

Invalid or missing key → **401 Unauthorized**.

---

## API Reference

### User and Project Setup

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users` | Create a new user account |
| `POST` | `/api/key_generate` | Create a project and generate an API key |
| `GET` | `/api/projects` | List all projects owned by a user |

`GET /api/projects` requires a `x-user-id` header. 

---

### Event Ingestion

All three ingest endpoints share the same request envelope:

```json
{
  "api_key":     "wt_abc123",
  "service":     "my-app",
  "environment": "production",
  "events": [ /* one or more event objects */ ]
}
```

| Method | Path | Event type |
|--------|------|------------|
| `POST` | `/ingest/error` | JavaScript errors with stack traces |
| `POST` | `/ingest/log` | User interaction logs (clicks, navigation) |
| `POST` | `/ingest/performance` | Timing spans (page loads, API calls) |

---

### Error API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/errors` | Paginated, filtered list of errors |
| `GET` | `/api/errors/:id` | Single error detail |
| `PATCH` | `/api/errors/:id` | Mark an error as resolved |

`GET /api/errors` supports the following query parameters:

| Param | Default | Notes |
|-------|---------|-------|
| `api_key` | required | — |
| `since` | — | ISO timestamp lower bound |
| `severity` | all | e.g. `error`, `critical` |
| `status` | all | `resolved` or `unresolved` |
| `page` | `1` | — |
| `limit` | `20` | Results per page |

---

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications/settings` | Get email toggle state for a project |
| `POST` | `/api/notifications/settings` | Update email toggle state |

`GET /api/notifications/settings` requires `user_id` and `project_id` query params.

`POST /api/notifications/settings` body:
\```json
{ "user_id": "...", "project_id": "...", "email_enabled": true }
\```

### Performance API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/performance` | Paginated performance events for a project |

`GET /api/performance` supports:

| Param | Default | Notes |
|-------|---------|-------|
| `api_key` | required | — |
| `entry_type` | all | `resource`, `paint`, or `navigation` |
| `since` | — | ISO timestamp lower bound |
| `page` | `1` | — |
| `limit` | `20` | — |

## Database

### Tables

- **`users`** — one row per registered user
- **`projects`** — one row per project, holds the API key and owner reference
- **`errors`** — one row per ingested error event, includes full payload,
  timestamps, severity, and resolution status
- **`logs`** — one row per ingested log event
- **`performance`** — one row per ingested performance event
- **`notification_settings`** — stores email digest preferences per user/project

The full schema is defined in `schema.sql`.

### Making Schema Changes

`schema.sql` defines the base schema and is safe to re-run on a fresh
environment (`CREATE TABLE IF NOT EXISTS`). It should not be edited to
reflect changes to an already-deployed database

For any change to an existing database, create a new migration file:

```bash
# Name it with today's date and a short description
touch migrations/YYYYMMDD_describe_your_change.sql

# Apply it
wrangler d1 execute watchtower-db \
  --file=migrations/YYYYMMDD_describe_your_change.sql
```plaintext

**Migration history:**

| Date | File | Change |
|------|------|--------|
| 2026-05-29 | `20260529_add_projects_owner_id.sql` | Added `owner_id` to `projects` |

---

## Common Errors

| Error | Likely cause |
|-------|-------------|
| `401 Unauthorized` | Missing or invalid `api_key` |
| `400 Bad Request` | Missing required fields or empty `events` array |
| `404 Not Found` | Route does not exist, or record not found for this project |
| `500 Internal Server Error` | D1 write failed — check Wrangler logs |
`