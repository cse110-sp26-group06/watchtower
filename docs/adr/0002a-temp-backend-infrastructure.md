# ADR-001: Use Cloudflare D1 as the Primary Database

## Status

- [ ] Pending
- [ ] Rejected
- [x] Accepted

---

## Context and Problem Statement

We need a database for storing users, projects, and error events ingested
from the Watchtower SDK. The database must support structured queries,
relational data across multiple tables, and seamless integration with
the Cloudflare Workers runtime.

---

## Decision Drivers

- Need structured SQL queries with filtering and pagination
- Need relational data across `users`, `projects`, and `errors` tables
- Need easy integration with Cloudflare Workers via D1 binding
- Need simple deployment within the existing Cloudflare ecosystem

---

## Considered Options

- Cloudflare D1
- Cloudflare KV
- Supabase / Postgres
- Firebase

---

## Decision Outcome

**Chosen: Cloudflare D1**

D1 is the right fit for Watchtower because the data model is inherently
relational — users own projects, projects own errors, and errors require
multi-column filtering (by `api_key`, `severity`, `status`, and
`server_timestamp`). D1's native SQL support handles all of these cleanly.

The D1 binding (`watchtower_db`) is declared in `wrangler.toml` and
accessed directly in `src/storage/d1.js`. All reads and writes go through
this storage layer.

### Schema (as implemented)

Three tables are in production:

- **`users`** — stores user accounts keyed by email (`id`, `email`,
  `created_at`)
- **`projects`** — stores API keys and project metadata, scoped to an
  owner (`id`, `name`, `api_key`, `created_at`, `owner_id`)
- **`errors`** — stores ingested error events with full payload,
  timestamps, severity, and resolution status
- **`logs`** — stores log events (`level`, `message`, `payload_json`, timestamps)
- **`performance`** — stores performance events (`name`, `entry_type`, `time`, `duration`, `payload_json`)
- **`notification_settings`** — stores email digest preferences per user/project

Indexes are defined on `(service, server_timestamp)`, `(status)`, and
`(severity)` to support Dashboard filtering and pagination

### Schema Migrations

The base schema is defined in `schema.sql` using `CREATE TABLE IF NOT
EXISTS` for safe re-runs. Additive changes are applied via numbered
migration files in `migrations/` and executed manually:

```bash
wrangler d1 execute watchtower-db --file=migrations/<filename>.sql
```plaintext

**Migration history:**

| Date       | File                                         | Change                              |
|------------|----------------------------------------------|-------------------------------------|
| 2026-05-29 | `20260529_add_projects_owner_id.sql`         | Added `owner_id TEXT` to `projects` |
| 2026-05-31 | `schema.sql` | Added `performance`, `logs`, `notification_settings` tables |

---

### Pros

- Native SQL — supports filtering, pagination, joins, and indexes
- Direct integration with Cloudflare Workers via `env.watchtower_db`
- Well-suited to the `users → projects → errors` relational structure
- No external service dependency — stays within the Cloudflare ecosystem

### Cons

- More setup than KV — requires schema definition and migration management
- Not as simple as key-value lookup for trivial read cases
- Schema changes require manual migration execution (no automated runner)

---

### Alternative Considered: Cloudflare KV

Cloudflare KV offers fast key-based lookups and is useful for caching,
configuration values, and simple read-heavy data. It was not chosen because
Watchtower requires multi-column filtering and relational ownership — neither
of which KV supports natively.