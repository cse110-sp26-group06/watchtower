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

**In words:** An error happens on a customer's site → SDK captures it → SDK POSTs to our Backend → Backend stores it and may trigger integrations (GitHub Issues, notifications) → Developer either logs into the Dashboard or gets pinged through their notification channel of choice.

---

## The Three Components

### SDK (owned by the Client SDK sub-team)

- **What it is:** A small vanilla JavaScript library that developers add to their website via a `<script>` tag (or eventually `npm install`).
- **Who it serves:** The customer-developer who installs it. Runs silently in the browsers of *their* end users.
- **Where it runs:** In the browser, on whatever website the customer installed it on. We don't control or operate this environment.
- **Responsible for:**
  - Capturing JavaScript runtime errors (`window.onerror`, unhandled promise rejections)
  - Capturing performance metrics (page load, long tasks)
  - Rendering feedback widgets / rating prompts
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
  - GitHub Issues creation when error thresholds are hit
  - Notification delivery (email / Slack / webhooks)
  - Build signal handling (tying errors to deployments)
- **NOT responsible for:** Rendering UI. Running customer-side code.

> The "outbound integrations" half (GitHub Issues, notifications, build signals) is a meaningful logical seam within the Backend. Don't be surprised if it ends up in its own folder or set of modules — but it's still Backend code, deployed and tested together.

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
| **Backend** | 3 | Ingestion API, storage, GitHub Issues + notifications | Cloudflare Workers + D1/KV |
| **Dashboard** | 3 | Developer-facing web app | Vanilla JS, Cloudflare Pages |
| **Process/Docs** | 2 | ADRs, Wiki, CI/CD config, PR template, retros, this primer | Markdown, GitHub Actions YAML |

A few notes on this structure:

- **Backend is larger because it absorbed Integrations.** GitHub Issues creation, notification delivery, and build signal handling all live inside the Backend Workers, so a separate sub-team would have created coordination overhead without much benefit. The 3-person Backend team will likely have one person focused primarily on the integration code.

- **SDK is smaller because the surface area is smaller.** The library itself is intentionally minimal, and 2 people pairing closely on it should have plenty to do.

- **Process/Docs members are encouraged to pair with feature sub-teams** when their workload allows. This keeps them connected to the product and spreads process literacy across the team. Process/Docs is not a permanent assignment to "the boring stuff" — it's a rotating-friendly home for the work that keeps the team running.

### Stability over rotation

We have roughly 4-5 sprints remaining in the quarter, which is too short a runway for meaningful rotation — switching sub-teams costs context we won't have time to recover.

- **Sub-team membership stays stable for the rest of the quarter.** Land in a sub-team and stay there.
- **Cross-team exposure happens through pairing, not rotation.** If you want to learn another component, pair with someone from that sub-team on a specific issue for a sprint. You don't have to switch teams to learn.
- **The week-9 review break is built-in cross-exposure.** Another team will evaluate our code and we'll evaluate theirs, so everyone naturally sees parts of the system they didn't build.

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

Consistent commit messages give us readable history, and they unlock the option to generate a changelog automatically later if we want to.

### Linting and the question of pre-commit hooks

We will run linters (ESLint, Prettier, markdownlint, possibly others) both locally and in CI. CI will reject unlinted code. The question is *how much we automate locally.*

There are two approaches we can take, and we'll decide which in an ADR:

- **Manual:** Each developer runs `npm run lint` (or equivalent) themselves before pushing. Simple, no extra setup, but easy to forget.
- **Automated via pre-commit hook:** A "pre-commit hook" is a script that runs automatically when you run `git commit`. The standard tooling for this is **Husky** (which manages git hooks across the team) plus **lint-staged** (which runs linters only on the files you're about to commit, so it stays fast). When configured, you literally cannot commit unlinted code without explicitly bypassing the hook.

The automated approach is more reliable but takes some setup time and occasionally annoys developers when it blocks a commit they were trying to make quickly. The manual approach trusts developers to remember. Either way, **CI is the final safety net** — unlinted code never reaches `main`.

For now: run `npm run lint` locally before pushing. We'll revisit pre-commit hooks once the linting tooling itself is in place.

### Changelog

We will maintain a `CHANGELOG.md` file at the repo root, following the [Keep a Changelog](https://keepachangelog.com/) format. Every release bumps the SemVer version and adds a corresponding section to the changelog.

There are three ways teams typically maintain a changelog, and we'll pick one in an ADR:

- **Manual:** A developer edits `CHANGELOG.md` by hand in the same PR that bumps the version. Simple, full editorial control, easy to forget.
- **Fully automated:** A tool like `release-please` or `standard-version` reads the Conventional Commits since the last release and generates the changelog automatically. Less work per release, but the output reflects raw commit history rather than user-facing impact.
- **Hybrid:** A tool generates a draft, then a human edits it before release. Tools like `changesets` support this — developers add a small description file when they make a meaningful PR, and the tool aggregates them at release time.

Manual works fine for a 10-week course project shipping a handful of releases. Automation pays off more for projects releasing weekly to real users. We'll start with whichever the team agrees on in our ADR and revisit if it's not working.

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

- **Repo:** `cse110-sp26-group06/watchtower`
- **Project board:** *<add link>*
- **Wiki / docs site:** *<add link>*
- **ADRs:** `/docs/adr/` in the repo
- **Design files (wireframes, etc.):** *<add link to Figma / Excalidraw>*
- **Slack channel:** *<add link>*
- **Meeting notes:** *<add link or repo path>*
- **TA meeting notes:** *<add link or repo path>*

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

**Husky** — A tool that manages git hooks (like pre-commit hooks) across the team in a shared way. We may or may not use it; see the Linting section.

**Ingestion endpoint** — A URL on the Backend that receives event data from the SDK.

**JSDoc** — A standard format for documenting JavaScript functions inline. Required on all public surfaces.

**KV** — Cloudflare Workers KV. A simple key-value store. One of our storage options.

**lint-staged** — A tool that runs linters only on files staged for commit, keeping checks fast. Pairs with Husky if we go the pre-commit hook route.

**Linting** — Automated code quality checks (e.g., ESLint, Prettier, markdownlint). Runs locally and in CI.

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