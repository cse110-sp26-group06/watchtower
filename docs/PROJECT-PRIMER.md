# WatchTower Project Primer

> **Start here.** This is the front door to the WatchTower project. If something in an issue, PR, or meeting is confusing, the answer is probably here. If it isn't, please add it.

---

## What WatchTower Is

WatchTower is an observability tool for developers. They add a small piece of code to their website, and WatchTower watches for errors, slow pages, and user complaints. When something goes wrong, it shows up on a dashboard, and (optionally) creates a GitHub issue or fires a notification.

Think Sentry or LogRocket, but small enough that one person could understand the whole thing end to end.

---

## The System at a Glance

```
  [Customer's Website]              [Our Infrastructure]              [External Channels]

   ┌──────────────┐    HTTP POST    ┌──────────────────┐    creates    ┌──────────────┐
   │ WatchTower   │ ─────────────►  │ Backend API      │ ────────────► │ GitHub       │
   │ SDK          │   event data    │ (Cloudflare      │   issues      │ Issues       │
   │ (script tag) │                 │  Workers + D1)   │               └──────────────┘
   └──────────────┘                 └──────┬───────────┘
                                           │                           ┌──────────────┐
                                           │ serves data    notifies   │ Email /      │
                                           ▼               ──────────► │ Slack /      │
                                    ┌──────────────────┐               │ Webhooks     │
                                    │ Dashboard        │               └──────┬───────┘
                                    │ (web app)        │                      │
                                    └────────┬─────────┘                      │
                                             ▲                                │
                                             │ logs in              receives  │
                                             │                      alerts    │
                                             │     ┌────────────────┐         │
                                             └─────┤ Developer using├─────────┘
                                                   │ WatchTower     │
                                                   └────────────────┘
```

**In words:** An error happens on a customer's site → SDK captures it → SDK POSTs to our Backend → Backend stores it → Developer logs into the Dashboard to view errors and performance data. Outbound integrations (GitHub Issues, notifications) are stretch goals being pursued time-permitting; see [ADR 0009](adr/0009-final-release-scope.md).

---

## The Three Components

### SDK (owned by the Client SDK sub-team)

- **What it is:** A small vanilla JavaScript library that developers add to their website via a `<script>` tag (or eventually `npm install`).
- **Who it serves:** The customer-developer who installs it. Runs silently in the browsers of *their* end users.
- **Where it runs:** In the browser, on whatever website the customer installed it on. We don't control or operate this environment.
- **Responsible for:**
  - Capturing JavaScript runtime errors (`window.onerror`, unhandled promise rejections)
  - Capturing performance metrics (page load, long tasks)
  - Batching events and sending them to the Backend
  - **Failing silently** — never crashing the host site
- **NOT responsible for:** Storing data. Displaying dashboards. Authentication. Filtering or processing events server-side. Anything heavy or risky. Every byte we add affects the customer's site performance, so the SDK stays minimal.

### Backend (owned by the Backend sub-team)

- **What it is:** A set of Cloudflare Workers that receive data from the SDK, store it, serve it to the Dashboard, and handle outbound integrations.
- **Who it serves:** The SDK (writing in) and the Dashboard (reading out). End users never hit it directly.
- **Where it runs:** Cloudflare Workers. Storage in Cloudflare D1 (SQLite) and/or KV.
- **Responsible for:**
  - Ingestion endpoints (receive POSTs from SDK)
  - Authentication / API keys
  - Storage of events, projects, configuration
  - Read APIs that the Dashboard consumes
- **Stretch goals (time-permitting):** GitHub Issues creation when error thresholds are hit, notification delivery (email / Slack / webhooks), build signal handling. These are not part of the confirmed MVP scope. See [ADR 0009](adr/0009-final-release-scope.md). If implemented, they will live in the Backend Workers.
- **NOT responsible for:** Rendering UI. Running customer-side code.

### Dashboard (owned by the Dashboard sub-team)

- **What it is:** A vanilla-JS web app where developers log in to see their data.
- **Who it serves:** The customer-developer (the same person who installed the SDK on their site).
- **Where it runs:** Cloudflare Pages.
- **Responsible for:**
  - Login / session UI
  - Listing projects, errors, performance metrics, feedback
  - Drilling into individual events
  - Configuring notification rules and integrations
- **NOT responsible for:** Capturing or storing data. Anything customer-facing other than the developer-as-user.

---

## Sub-Team Structure

We have 10 team members organized into 4 sub-teams:

| Sub-team | Size | Owns | Tech |
|---|---|---|---|
| **Client SDK** | 2 | The injectable library | Vanilla JS, hosted as a script and possibly published to npm |
| **Backend** | 3 | Ingestion API, storage, read APIs | Cloudflare Workers + D1/KV |
| **Dashboard** | 3 | Developer-facing web app | Vanilla JS, Cloudflare Pages |
| **Process/Docs** | 2 | ADRs, Wiki, CI/CD config, PR template, retros, this primer | Markdown, GitHub Actions YAML |

A few notes on this structure:

- **Backend is larger because the surface area is larger.** Ingestion, storage, auth, and read APIs cover a lot of ground for 3 people. Outbound integrations (GitHub Issues, notifications) are stretch goals that may be tackled time-permitting.

- **SDK is smaller because the surface area is smaller.** The library itself is intentionally minimal, and 2 people pairing closely on it should have plenty to do.

- **Process/Docs members are encouraged to pair with feature sub-teams** when their workload allows. This keeps them connected to the product and spreads process literacy across the team. Process/Docs is not a permanent assignment to "the boring stuff" — it's a rotating-friendly home for the work that keeps the team running.

### Stability over rotation

Sub-team membership mostly stayed stable for the duration of the quarter. Switching teams mid-project costs context there isn't time to recover. Cross-team exposure happened through pairing on specific issues and the week-9 peer code review, where each team evaluated another team's codebase.

---

## Working Agreements

These are the habits we follow consistently across every change. They exist because *process is the grade* — being sloppy on these costs us points even if the final product works well.

### Code documentation as you go

Update docs in the **same PR** as the code change, not in a "documentation sprint" later. If you change how something works, update the README / Wiki / inline comments / this primer in the same commit. Docs that lag behind code create confusion for the next person.

### JSDoc on public surfaces

Every exported function, class, and module gets a JSDoc block describing parameters, return values, and any non-obvious behavior. Internal helpers don't need it, but if it's used outside its own file, document it.

```javascript
/**
 * Sends a captured error event to the WatchTower backend.
 * Fails silently if the network is unavailable.
 * @param {ErrorEvent} event - The captured error
 * @param {string} apiKey - The customer's project API key
 * @returns {Promise<boolean>} true if delivery succeeded
 */
async function sendError(event, apiKey) { ... }
```

### Pull requests for batches over 300 lines of code

Any change that adds or modifies more than **300 lines of code** must go through a pull request reviewed by **another human team member** before merging. This includes AI-generated code — the human reviewer is the safeguard, not the AI. Smaller changes can land on feature branches more freely but should still hit a PR before reaching `main`.

### Conventional Commits

Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat: add error rate threshold notifications`
- `fix(sdk): handle CORS errors silently`
- `docs: update primer with new sub-team`
- `chore: bump dependency versions`
- `test(backend): add ingestion endpoint coverage`
- `refactor(dashboard): extract chart rendering into module`

Consistent commit messages keep history readable and leave the door open for automation if the team ever revisits the changelog/versioning decision.

### Linting

We will run a linter (ESLint) both locally and in CI. Run `npm run lint` locally before pushing. See [ADR 0004](/docs/adr/0004-linting-framework.md)

### Changelog

We maintain a `CHANGELOG.md` file at the repo root, following the [Keep a Changelog](https://keepachangelog.com/) format.

WatchTower uses **unified Semantic Versioning** for the whole repo: one `v0.x.y` version per release, shared across the SDK, Backend, and Dashboard. The SDK's published package version should mirror the repo version.

For this project, changelog maintenance is **manual**. At release time, a developer updates `CHANGELOG.md` in the same PR that bumps the version. This keeps the process simple and avoids depending on perfect Conventional Commit discipline or extra release automation.

See [ADR 0005](/docs/adr/0005-changelog-and-versioning.md) for the rationale.

### GenAI usage must be disclosed

If you used Claude, Copilot, ChatGPT, Cursor, or any other GenAI tool to produce code or content in a PR, please say so in the PR description. Brief is fine:

> *Used Claude to scaffold the event batching logic; reviewed and modified roughly 30% of the output. Tests are entirely human-written.*

We're not hiding AI usage; we're being transparent about it because the rubric requires it.

### Tests come with the code, not at the end

Every new piece of functionality should have at least one test added in the **same PR**. Unit tests for logic; E2E for user-visible flows. The rubric explicitly punishes tests being applied only at the conclusion of the project, and we want a commit history that shows testing distributed throughout.

### Branching

Work on feature branches, not `main`. Branch names should be descriptive: `sdk/error-capture`, `backend/ingestion-endpoint`, `dashboard/login-flow`. Merge to `main` via PR after review. The specific branching strategy may evolve — see the relevant ADR.

### Definition of Done

A task isn't done until **all** of these are true:

- [ ] Code works and is committed
- [ ] Tests added (unit and/or E2E as appropriate) and passing
- [ ] JSDoc on any new public surfaces
- [ ] Linting passes locally and in CI
- [ ] Docs updated (README, Wiki, this primer if relevant)
- [ ] Commit messages follow Conventional Commits
- [ ] PR description discloses any AI usage
- [ ] If >300 LoC: reviewed by another human team member
- [ ] Issue moved to Done on the project board

When in doubt, ask a teammate.

---

## How to Read an Issue

Every issue should have:

- A **Sub-team** tag — tells you which component it touches
- An **Iteration** — which sprint it belongs to
- A **Priority** and **Estimate**
- A **Status** (Backlog / Ready / In Progress / In Review / Done)

If a term in the issue isn't familiar, check the **Glossary** below. If a term *should* be in the glossary but isn't, please add it in the same PR as your work.

---

## Where to Find Things

- [**Repo**](https://github.com/cse110-sp26-group06/watchtower)
- [**Project board**](https://github.com/orgs/cse110-sp26-group06/projects/1)
- **Wiki / docs site:** *<add link>*
- [**ADRs**](/docs/adr/index.md)
- [**Design files (wireframes, etc.)**](/docs/ucd/)
- [**Meeting notes**](https://github.com/cse110-sp26-group06/cse110-sp26-group06/tree/main/admin/meetings/Team%20Meetings)
- [**TA meeting notes**](https://github.com/cse110-sp26-group06/cse110-sp26-group06/tree/main/admin/meetings/TA%20Meetings)

---

## Glossary

**ADR** — Architectural Decision Record. A short document capturing one technical decision (context, options, choice, consequences). Written in MADR format, stored in `/docs/adr/`.

**Backend** — The Cloudflare Workers component that receives, stores, and serves data, and handles outbound integrations. One of the three main components.

**CDN** — Content Delivery Network. A way to host files (like our SDK script) so they load fast from anywhere in the world.

**Changelog** — A file (`CHANGELOG.md`) listing what changed in each release. We follow the Keep a Changelog format.

**CI/CD** — Continuous Integration / Continuous Deployment. Our GitHub Actions pipeline that runs tests and lints on every PR and deploys on merge.

**Cloudflare Pages** — Cloudflare's static-site hosting product. Where the Dashboard is deployed.

**Cloudflare Workers** — Cloudflare's serverless runtime. Where the Backend runs.

**Conventional Commits** — A commit message format (`type: description`) that we use to keep history readable and to enable optional changelog automation.

**D1** — Cloudflare's SQLite-based database. One of our storage options for the Backend.

**Dashboard** — The web app where developers log in to see their data. One of the three main components.

**Definition of Done** — Our checklist for what counts as a finished task. See the Working Agreements section.

**E2E (test)** — End-to-end test. Exercises the system the way a real user would (e.g., loading the Dashboard in a real browser via something like Playwright).

**Husky** — A tool that manages git hooks (like pre-commit hooks) across the team in a shared way. The team decided not to use it. Linting is enforced in CI rather than via pre-commit hooks.

**Ingestion endpoint** — A URL on the Backend that receives event data from the SDK.

**JSDoc** — A standard format for documenting JavaScript functions inline. Required on all public surfaces.

**KV** — Cloudflare Workers KV. A simple key-value store. One of our storage options.

**Linting** — Automated code quality checks via ESLint. Covers `.js`, `.html`, and `.css` files. Runs locally (`npm run lint`) and in CI.

**LoC** — Lines of Code. We use this as the threshold for requiring a PR with human review (>300 LoC).

**MADR** — Markdown Any Decision Records. The specific template format we use for ADRs.

**Mobbing** — Working as a whole team on the same task at the same time. Used early in the project for design work.

**Pairing** — Working in pairs on the same task.

**PR** — Pull Request. Required for changes over 300 lines.

**Pre-commit hook** — A script that runs automatically when you run `git commit`. Can be used to block commits that fail linting. Optional — see the Linting section.

**PWA** — Progressive Web App. We're *not* building one; it was just one option in the project spec.

**SDK** — Software Development Kit. The injectable JavaScript library that customers install on their websites. One of the three main components. Sometimes called the "client library" or "injectable."

**SemVer** — Semantic Versioning. The MAJOR.MINOR.PATCH versioning scheme (e.g., `1.4.2`). MAJOR for breaking changes, MINOR for new features, PATCH for bug fixes.

**Sprint** — A one-week chunk of work, Sunday to Sunday.

**Unit test** — A test that exercises a small piece of code in isolation, without spinning up the whole system.

**Worker** — A single piece of code running on Cloudflare Workers. The Backend may consist of one or several Workers.

---

*This primer is a living document. If something is wrong, missing, or unclear, please fix it in a PR. The Process/Docs sub-team is its formal owner, but everyone is responsible for keeping it current.*