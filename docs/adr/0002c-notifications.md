# ADR-0002c: Daily Email Digest Notifications

## Status
- [ ] Pending
- [ ] Rejected
- [x] Accepted

---

## Context and Problem Statement

WatchTower needs a way to notify developers about errors in their projects
without requiring them to manually check the dashboard every day. We need
a notification system that keeps developers informed without overwhelming
them with alerts for every individual error, thus Watchtower team decided to
send daily digest of errors for users who turned the notification setting on.

---

## Decision Drivers

- Developers should be passively informed about production errors
- Notifications should not spam the developer with every single error, and those who did not turn on notifications will not recieve errors
- System should be simple to implement and maintain within existing infrastructure
- Should integrate with the existing user and project data model

---

## Considered Options

- **Real-time notifications** — send an email every time an error occurs
- **Daily digest** — send one email per day summarizing the last 24 hours
- **In-app notifications only** — show alerts in Dashboard, no email

---

## Decision Outcome

**Chosen: Daily digest email**

A single daily summary is actionable and predictable. Real-time notifications
would spam the developer for every error event, which is too noisy for most
use cases considering the main customers are startup company or working developers. 
In-app only notifications require the developer to actively check
the dashboard. A daily digest has the right balance.

---

## Implementation

### Database

A new `notification_settings` table stores per-user, per-project preferences:

```sql
CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    email_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id), 
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

`email_enabled` is stored as `0` (off) or `1` (on) — This is converted from true, false input from
the dashboard request to be consistent with SQLite properties.

### API Endpoints

Two endpoints allow Dashboard to read and update the toggle:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications/settings` | Get current email toggle state |
| `POST` | `/api/notifications/settings` | Update email toggle state |

`GET` requires `user_id` and `project_id` as query parameters.
`POST` body: `{ "user_id": "...", "project_id": "...", "email_enabled": true/false }`

If no row exists for a user/project combination, `GET` returns `email_enabled: false`
as the default — notifications are off until explicitly enabled.

The storage layer uses an upsert pattern — if a row exists it updates it,
otherwise it inserts a new one. This prevents duplicate rows.

### Cron Job

A Cloudflare Cron Trigger fires daily at 17:00 UTC (9am PST):

```toml
[triggers]
crons = ["0 17 * * *"]
```

The cron handler in src/cron/digest.js:
1. get all rows in notification_settings where email_enabled = 1
2. For each project — fetches their error count from the last 24 hours
3. Fetches the top 3 most frequent errors grouped by message to display in the email
4. Builds an HTML email with the digest
5. Sends via Resend API

### Email Service

**Chosen: Resend**

Resend was chosen for its simple REST API, free tier (3,000 emails/month),
and easy integration with Cloudflare Workers via `fetch`. The API key is
stored as a Cloudflare Worker secret (`RESEND_API_KEY`).

The email is sent from `onboarding@resend.dev` in development. Production
deployment requires a verified custom domain in Resend to send to arbitrary
email addresses — the free tier sandbox restricts sending to the account
owner's email only. As the project does not have a domain and does not expect expenditure
for the tool, the resend is sending only to one of the members user email that is verified

### Email Format

The digest email includes:
- WatchTower logo and masthead
- Project name
- Total error count for the last 24 hours
- Top 3 most frequent errors with occurrence counts
- Link to the Dashboard
- Unsubscribe note

---

## Pros

- Low noise — one email per day, developer knows when to expect it. does not fire for every individual error
- Serverless — Cloudflare Cron Triggers require no additional infrastructure
- Free — Resend free tier covers 3,000 emails/month
- Opt-in — notifications are off by default, developer must explicitly enable

## Cons

- Not real-time — critical errors are not surfaced immediately
- Requires a verified custom domain for production multi-user sending, thus we cannot send the email for emails that are not verifed.
- Email delivery depends on Resend's availability and performance. Takes 2-3 more minutes after the request sent to Resend
- Cron runs at a fixed UTC time — no per-user timezone support yet

---
