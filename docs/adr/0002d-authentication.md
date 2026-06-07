# ADR-003: Authentication Strategy

## Status
- [ ] Pending
- [ ] Rejected
- [x] Accepted

---

## Context and Problem Statement

WatchTower has two types of callers that need to authenticate with the
Backend:

1. **The SDK** — running in a customer's browser, sending error/log/performance
   events to the ingestion endpoints
2. **The Dashboard** — a web app used by the developer to view and manage
   their project's events

We need an authentication strategy that is simple to implement for an MVP while
guarantees enough security

---

## Decision Drivers

- SDK runs in customer browsers — must be lightweight, no server-side session
- Dashboard needs to identify which projects belong to which developer, thus each project allocated to user
- No password management complexity for Sprint 4 MVP
- Must prevent one project from reading another project's data, limit access only to projects allocated to the user
- API keys must be easy to generate and revoke per project

---

## Considered Options

- **API keys only** — each project gets a unique key, no user identity, this is from sprint 1
- **API keys + user_id stub** — API keys for project auth, user_id for ownership
- **Session-based auth** — server-side sessions with cookies

---

## Decision Outcome

**Chosen: API keys + user_id stub**

API keys are the right tool for SDK authentication. They are simple
and easy to include in HTTP requests from a browser. This enables the post
requested to be accepted only when it is inside the server, and is used as an
identifier for the project. This prevents spamming the post by unauthorized user.

For Dashboard identity, user id is used, while we need to provide all the information
allocated to the user. Thus we allocate each project api key to the user and send it to
dashboard for temporary use in session of the user.

---

## Implementation

### API Keys

API keys identify a project, not a user. Every project has exactly
one API key stored in the `projects` table.

**Format:** `wt_` prefix followed by a UUID with hyphens removed:
```
wt_af2c84ed5ec74adbac3ac9a158505766
```

**Generation:** `crypto.randomUUID().replace(/-/g, '')` — uses the
Web Crypto API available in Cloudflare Workers. This enables generating 
unique id for each project

**Storage:** Stored in the `projects` table with a `UNIQUE` constraint.
Collisions are prevented by the constraint. If there is a collision in D1 it 
returns an error and the key is regenerated.

**Validation:** Every ingest and read request runs `validateApiKey()` in
`src/middleware/auth.js` which queries the `projects` table:
```sql
SELECT * FROM projects WHERE api_key = ?
```
Invalid or missing key return 401 unauthorized response

**Where to send the key:**

| Request type | Where to put `api_key` |
|--------------|------------------------|
| `POST /ingest/*` | Inside the JSON body |
| `GET /api/errors` | Query parameter `?api_key=` |
| `GET /api/performance` | Query parameter `?api_key=` |
| `PATCH /api/errors/:id` | Query parameter `?api_key=` |

### User Identity (Sprint 4 Stub)

Developers are identified by a `user_id` UUID. The identity flow is:

1. Developer calls POST /api/users with their email → Backend creates
   a row in the users table and returns a `user_id`
2. Developer stores `user_id` in localStorage
3. For project-scoped requests, Dashboard sends `x-user-id` header
4. Backend calls getUserById() to verify the user_id refers to a
   real user before treating them as a project owner

This establishes the ownership relationship (users → projects) without
sophisticated security procedure like hashing.

### Project Ownership

Every project has an `owner_id` foreign key referencing the `users` table.
`GET /api/projects` returns only projects owned by the requesting user:
```sql
SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC
```

API key validation does not check ownership — any valid key can ingest
events. Ownership is only enforced for Dashboard project management.

---

## Pros

- no token refresh, no cookie management, no password hashing
- API key validation is a single D1 lookup, no need for additional lookup
- Each project has its own key, one project cannot read another's data which enhance security
- Ownership model established, which each user owns the projects

## Cons

- API keys do not expire, thus leaked ones cannot be used by unauthorized individuals
- No real user authentication 
- No rate limiting, possible for the attackers to overflow the system
- Cannot delete information and api keys from dashboard side.
- Can create new account outside of dashboard.

---
