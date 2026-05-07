# WatchTower — Project Notes from CSE 135 site

## The Pipeline (Lifted Directly from CSE 135)

CSE 135 organizes the analytics project into six phases, and WatchTower fits the same shape almost exactly:

```
COLLECT  →  PROCESS  →  STORE  →  REPORT  →  DASHBOARD  →  DECIDE
 (browser)  (validate,  (DB)    (JSON API)  (charts/      (act on
            enrich,                          tables)       what you see)
            sessionize)
```

CSE 135 calls phase 6 "Decisions" — for WatchTower, that's the whole point. Generic analytics asks "did pageviews go up?" WatchTower asks "did this deploy break something, and what should I fix first?"

---

## How Each CSE 135 Phase Maps to WatchTower

### Phase 1 — Collector (the `<script>` tag your customers embed)

CSE 135's collector tutorial is **10 modules** building from a first beacon up to a production library. The reference implementation is `collector.js` (~565 lines). For WatchTower, the modules that matter most are:

| Module | What It Teaches | WatchTower Relevance |
|---|---|---|
| 01 — Hello Beacon | `navigator.sendBeacon()`, fire-and-forget JSON | Foundation. Every event uses this. |
| 02 — Technographics | Browser/device/network info | Useful context on every error: which browser, viewport, connection type |
| 04 — Custom Endpoint | POST handler + CORS + sendBeacon → fetch fallback | This is your ingestion endpoint design |
| 05 — Performance Timing | Navigation Timing API, TTFB, DOM milestones | One of WatchTower's three core signals |
| 06 — Web Vitals | LCP, CLS, INP via PerformanceObserver | Core Web Vitals are the standard performance ratings |
| **07 — Error Tracking** | JS errors, promise rejections, resource fails, dedup | **Heart of WatchTower.** Pay extra attention here |
| 08 — Configuration API | Refactor into a library w/ `init()`, `track()`, sampling | This is what your customers call to embed you |
| 09 — Extensions/Plugins | `collector.use()` registration | Useful for the **rating widget / feedback form** plugins |
| 10 — Production Readiness | Async loading, retry queue, bot detection, minification | Operational hardening — required because you're operational software |

**WatchTower-specific additions** beyond what CSE 135 covers in its analytics frame:

- A **rating widget** (`👍 / 👎` or 1–5 stars) you ship as a plugin — when a user clicks, it fires an event into your pipeline
- A **feedback form** plugin (`"What went wrong?"` + free-text + email) — same thing, richer payload
- A **deploy marker** API: customers POST `{ app_id, version, commit_sha, deployed_at }` to a dedicated endpoint when they ship. Your dashboard then overlays vertical lines on charts so spikes line up visually with deploys.

### Phase 2 — Server Processing (your ingestion endpoint)

CSE 135's server-processing phase is **4 modules**: Node/Express endpoint, PHP/PDO endpoint, validation/sanitization, and session stitching.

For WatchTower the validation step is critical because **the client cannot be trusted**. Anyone can POST anything to your endpoint. You need to:

- Validate every field against an expected schema (drop, don't crash, on bad input)
- Cap payload size (no 5MB error stack traces)
- Rate-limit by `app_id` or IP (a single misbehaving customer page can DDoS you)
- Enrich with server-side fields the client can't fake: `server_timestamp`, `ip_country`, parsed `user_agent`
- Assign or stitch a `session_id` — group events into user sessions so "user X hit 3 errors then bounced" is a query you can run

**Your stack constraint:** the spec says server-side runs on Cloudflare or GitHub Pages. GH Pages is static-only. So in practice this is a **Cloudflare Worker** that takes the POST and writes to a Cloudflare-supported store. The Node/Express patterns from CSE 135 translate fairly cleanly to Workers (similar request/response objects), but you can't lift the code — you have to port the patterns.

### Phase 3 — Storage (the database)

CSE 135's reference schema uses **MySQL with 6 tables**: `pageviews`, `events`, `errors`, `performance`, `sessions`, `users`. Indexes for common queries, partitioning for retention.

You can't run MySQL on Cloudflare. Realistic options:

- **Cloudflare D1** — SQLite-compatible, serverless. Closest analog to the CSE 135 MySQL setup. SQL queries port over with minor dialect adjustments.
- **Cloudflare KV** — key-value, eventually consistent. Fine for simple lookups, terrible for analytics queries (no SQL, no aggregates).
- **Cloudflare R2 + something** — object storage, you'd build aggregation on top. Probably more work than it's worth for a course project.

**D1 is almost certainly the right answer.** Confirm with your TA before committing — that's an ADR-worthy decision.

WatchTower-flavored schema sketch (a starting point, not the answer):

```
apps           (app_id, name, owner_user_id, created_at, api_key)
deploys        (deploy_id, app_id, version, commit_sha, deployed_at)
errors         (error_id, app_id, session_id, message, stack, url,
                user_agent, server_timestamp)
performance    (perf_id, app_id, session_id, lcp, cls, inp, ttfb,
                load_time, url, server_timestamp)
feedback       (feedback_id, app_id, session_id, rating, comment,
                url, server_timestamp)
sessions       (session_id, app_id, first_seen, last_seen, country, ua)
users          (user_id, email, password_hash, role)  -- dashboard users
```

The `apps` and `deploys` tables are WatchTower-specific; CSE 135's reference doesn't have them because their pipeline is single-tenant.

### Phase 4 — Reporting API

CSE 135 covers this in **2 modules**: Node and PHP versions of authenticated JSON endpoints. The point is the *shape*, not the language: read-only endpoints that aggregate data for the dashboard.

For WatchTower:

```
GET  /api/apps                           list apps the user owns
GET  /api/apps/:id/errors?since=24h      error feed
GET  /api/apps/:id/errors/top?since=7d   error triage list (frequency-ranked)
GET  /api/apps/:id/performance?metric=lcp&bucket=hour  perf timeseries
GET  /api/apps/:id/feedback              feedback ratings + comments
GET  /api/apps/:id/deploys               deploy markers for chart overlays
POST /api/apps/:id/deploys               customers POST when they ship
POST /api/login                          dashboard auth
```

Auth: session cookies signed by your Worker, or a JWT — both work. Role-based access if you want owner/viewer separation. Rate-limit reads too, not just writes.

### Phase 5 — Dashboard

CSE 135's dashboard is **4 modules**: login, overview with charts, speed/error reports, user admin. Built as a vanilla JS SPA — which lines up perfectly with your "no frameworks" constraint.

WatchTower views, roughly:

- **Login**
- **App list** (every app this user has access to)
- **App overview** — error rate, p75 LCP, avg feedback score, all as time-series with deploy markers overlaid
- **Errors** — ranked list, click into one to see frequency over time, browser breakdown, stack trace, affected URLs
- **Performance** — Core Web Vitals trend, per-page breakdown
- **Feedback** — rating distribution, recent comments
- **Deploys** — table of recent deploys with "errors in the hour after this deploy" stat


### Phase 6 — Decisions (this is the WatchTower thesis)

CSE 135's "Decisions" module is the most important page on that site for understanding what WatchTower is *for*. The framing it gives:

- **Vanity metrics vs. actionable metrics.** "Total errors logged" is vanity. "Error rate per 1,000 pageviews trending up week-over-week" is actionable. Every metric on your dashboard should pass the test: *if this number changes, do I know what to do next?*
- **Performance budgets.** Set thresholds (LCP < 2500ms, error rate < 5/hour). When breached, that's a signal — same severity as a failing test.
- **Error triage.** Not all errors are equal. Rank by frequency × impact × severity. The example from CSE 135: a `TypeError` firing 200×/day on `/checkout` is critical; a `ResizeObserver` warning firing 340×/day on every page is browser noise — filter it out.
- **Alerting.** A dashboard nobody checks is the same as no dashboard. The simplest implementation: a cron-style job that runs a threshold query every N minutes and posts to a Slack webhook if breached. Start there. Don't over-engineer.
- **The continuous improvement loop:** Measure → Analyze → Decide → Act → Measure. Every release should include a check against the dashboard.

**This is what makes WatchTower different from a generic analytics tool.** Pageview analytics ask "did engagement go up?" Operational analytics ask "is something on fire, and which deploy caused it?" The Decisions module is the playbook for the second question.

---

## Stack Translation: CSE 135 → Your Constraints

| CSE 135 Reference | Your Likely Choice | Why |
|---|---|---|
| Node + Express OR PHP + Apache | Cloudflare Workers | Spec restricts server-side to Cloudflare or GH Pages |
| MySQL | Cloudflare D1 (SQLite) | Only SQL option that runs on the allowed platforms |
| Cookies for session auth | Signed cookies from Worker, or short-lived JWTs | Workers don't have stateful sessions out of the box |
| Static files via Apache | GitHub Pages or Cloudflare Pages | Both are spec-allowed; Cloudflare Pages co-locates with Workers nicely |
| Chart.js/D3 (referenced) | Chart.js (with TA approval, via ADR) | Vanilla JS canvas drawing for charts is a course-project black hole |
| `cron + bash + curl` for alerts | Cloudflare Cron Triggers + `fetch` to Slack/Discord webhook | Same pattern, platform-native |

---

## Things the Spec Cares About That CSE 135 Doesn't Cover

CSE 135 is a tech tutorial — it teaches you how to build the thing. The CSE 110 spec is grading you on **how you built it**, which is mostly orthogonal:

- **Process documentation in GitHub** — sprint planning, standups, retros, TA meetings, all captured in the repo
- **ADRs in MADR format** — every major technical decision (D1 vs KV, Chart.js vs raw canvas, GH Pages vs Cloudflare Pages, monorepo vs split) gets a short markdown record in the repo
- **CI/CD via GitHub Actions** — tests + lint on PR, deploy on merge to `main`
- **SemVer + Conventional Commits + Changelog** — `feat:`, `fix:`, `chore:`, etc.
- **Pull-request review for changes >300 LoC**, even AI-generated ones
- **Unit + e2e tests early, not at the end** — the prompt explicitly flags that bolting tests on at the end loses points
- **Docs site** (GitHub Wiki or a small static site) for future maintainers
- **JSDoc comments** on functions you write

None of this is in the CSE 135 site, but all of it is what your grade depends on.

---

## OpenTelemetry: The Bigger Picture

CSE 135's Decisions module ends with a section on OpenTelemetry, which is worth knowing because it's where the industry has settled. WatchTower is essentially a tiny version of an OTel pipeline:

| Your Component | OTel Equivalent |
|---|---|
| Your `collector.js` | `@opentelemetry/sdk-trace-web` |
| Your ingestion endpoint | OTLP/HTTP transport |
| Your validation/enrichment Worker | OTel Collector (processors, exporters) |
| Your D1 tables | Tempo (traces), Prometheus (metrics), Loki (logs) |
| Your dashboard | Grafana |

You're not building OTel. But knowing this map is useful: if your TA or prof asks "why not just use OTel?", the honest answer is "we're learning by building the primitives ourselves; OTel is what you'd reach for in production."

---

## Possible Questions for TA

1. **D1 vs KV vs something else** for storage — which does the TA approve? (ADR-blocking)
2. **Chart.js as a dependency** — yes/no? If no, what's the alternative for time-series charts?
3. **Single-tenant or multi-tenant?** Do we model `apps` so one WatchTower instance can watch multiple customers' apps, or is each WatchTower deployment tied to one customer?
4. **Deploy markers** — does the rubric want this integration, or is it stretch?
5. **User auth on the dashboard** — full email/password + roles, or magic-link-only, or even just an API-key-per-app with no real users?
6. **Test framework** — what does the TA expect? Vitest is the modern vanilla-JS pick; Playwright for e2e.

---

## Recommended Reading Order (from the CSE 135 site)


1. [Analytics Overview](https://cse135.site/analytics-overview.html) — conceptual frame
2. [Project Hub](https://cse135.site/project/) — the pipeline picture
3. [Collector Tutorial overview](https://cse135.site/project/collector-tutorial/) — modules 01, 04, 06, 07 are the priority
4. [Decisions](https://cse135.site/project/decision/) — read this **first** if you only read one page; it's the *why*
5. [Storage](https://cse135.site/project/storage/) — the schema thinking
6. [Dashboard](https://cse135.site/project/dashboard/) — what you're building toward
7. [Tools](https://cse135.site/project/tools/) — the performance budget calculator is genuinely useful

---


The grading rubric prioritizes **process over product**, and the topic itself rewards **stability over features**. Both pressures point the same direction: build a small, well-documented, well-tested core, and resist scope creep. A WatchTower that reliably captures errors, performance, and feedback for one toy app — with great ADRs, tests, and CI — beats a feature-rich one with sparse docs every time.
