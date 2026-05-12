# Sprint 2 — Issues

*Use these as the basis for GitHub Issues. Sub-teams should adjust scope, split, or merge during sprint planning as needed. Suggested labels in parentheses.*

---

## Sprint 2 in context

The goal this week is to build the error path end-to-end — SDK captures, Backend ingests, Dashboard displays — and nothing else. By Sunday, the spine of the product is real and validated, and the rest of the sprints can add the rest of the MVP (performance, feedback, build signals, notifications) on top of an already-working pipeline.

The trade-off: focusing one sprint on one feature done well means each of the four remaining MVP features gets roughly one sprint, with no slack. Every remaining feature will be minimal in scope by necessity. That's intentional and consistent with the spec's framing that "more features equal more risk."

If a sub-team finishes its issues by Day 5 or 6, the right move isn't to pull in features from Sprint 3 — it's to harden what's built (more tests, better error handling, integration polish) so Sprint 3 starts on a solid foundation rather than against carryover debt.

---

## Cross-cutting expectations

The following apply to every issue's Definition of Done and aren't tracked as discrete issues:

- **Tests.** Each feature ships with unit tests covering happy paths and primary error cases. Test runner and framework per the Testing ADR (DOCS-1).
- **Inline documentation.** JSDocs on public APIs and exported functions. Inline comments where logic isn't self-explanatory. Per the project requirement that documentation be maintained "as you go along."
- **Lint passing.** ESLint, Prettier, and markdownlint clean in CI before merge.
- **Conventional Commits.** Commit messages follow the format the team agreed in Sprint 1.

End-to-end integration of SDK → Backend → Dashboard is validated on integration day (see Notes for sprint planning), not as a separate issue.

---

## Client SDK

### SDK-1: Set up real SDK project structure
*(label: sub-team/sdk, type/setup)*

Replace the Sprint 1 spike with a proper module structure. Establish source layout, build setup as required by the distribution ADR, lint inheritance from Process/Docs, and the test runner chosen in the Testing ADR.

**Done when:** Project builds and tests run (even with empty suites). Lint passes in CI. Spike code retired from `spikes/`.

### SDK-2: Implement error capture module
*(label: sub-team/sdk, type/feature)*

Capture `window.onerror` and `unhandledrejection`. Normalize errors into the event shape per the ingestion contract. Expose `captureError(err, context)` for manual capture. Must never throw or crash the host page.

**Done when:** Errors from a test page produce events conforming to the contract. Failures inside the capture path are swallowed silently. Unit tests cover both automatic and manual capture.

### SDK-3: Implement event batching and transport
*(label: sub-team/sdk, type/feature)*

Queue events, flush on a size threshold and a time threshold, POST to the Backend ingestion endpoint per the contract. Include the API key in the auth header. Simple retry on transport failure.

**Done when:** Batching and flush logic is unit tested. Integration test or manual test confirms events reach a running Backend.

### SDK-4: Implement init/config API
*(label: sub-team/sdk, type/feature)*

Build `watchtower.init({...})` matching the API design doc. Minimum accepted options: project key, endpoint URL, `debug` flag. Wires up global handlers and the batcher.

**Done when:** A sample integration page calls `watchtower.init()` and captures errors successfully. API matches the design doc, or the design doc is updated to match.

### SDK-5: Stand up SDK distribution + usage docs
*(label: sub-team/sdk, type/infra)*

Per the distribution ADR. If npm: publish package (private if appropriate) and verify the install path. If CDN: build pipeline drops the file at a fetchable URL. If both: both. Includes the SDK usage section in `/docs/` with working code examples that match the actual API.

**Done when:** Someone outside the SDK sub-team can fetch, install, and use the SDK following only the README. Examples in the README run successfully against a deployed Backend.

### SDK-6: Instrument testing app with SDK
*(label: sub-team/sdk, type/feature)*
 
Pairs with DOCS-6. Once the testing app is chosen and deployed, embed the SDK in it, verify events flow through to the deployed Backend, and add a few controlled error paths (intentional buttons or routes that throw known errors) so demos and the May 21 presentation have predictable events to surface.
 
**Done when:** Testing app has the SDK embedded and is producing real events visible in the Dashboard. At least 2-3 controlled error paths exist and are documented for demo use.

---

## Backend

### BE-1: Set up real Worker project
*(label: sub-team/backend, type/setup)*

Replace the Sprint 1 spike with a real Cloudflare Worker project. Wrangler config, project structure, test runner per the Testing ADR.

**Done when:** `wrangler dev` runs locally. Tests run (even if empty). Spike code retired from `spikes/`.

### BE-2: Implement ingestion endpoint
*(label: sub-team/backend, type/feature)*

Accept POSTs from the SDK per the ingestion contract. Validate payload shape, reject malformed events with appropriate 4xx, hand valid events to the storage layer. Return the response shape the contract specifies.

**Done when:** Endpoint accepts conformant payloads and rejects nonconformant ones. Unit tests cover both paths.

### BE-3: Implement storage layer
*(label: sub-team/backend, type/feature)*

Per the Infrastructure ADR. Define keys/schema for ingested events. Implement write path; basic read function used by the read endpoint.

**Done when:** Events written via the ingestion path are readable from storage. Schema documented in code or `/docs/`. Tests cover write and read.

### BE-4: Implement API key authentication
*(label: sub-team/backend, type/feature)*

Per the ingestion contract. A project record stores its API key; ingestion validates the inbound key against the record. Reject missing or invalid keys.

**Done when:** Valid keys accepted, invalid rejected with the contract-specified status code. Tests cover both paths.

### BE-5: Implement `GET /api/errors` read endpoint
*(label: sub-team/backend, type/feature)*

Per Dashboard's API needs doc. Returns errors for a given project with basic paging. Response shape matches what Dashboard agreed to.

**Done when:** Endpoint returns conformant data. Tested with mock data and with real data flowing in via the ingestion path.

### BE-6: Set up CI/CD to Cloudflare
*(label: sub-team/backend, type/infra)*

GitHub Actions workflow deploying the Worker on merge to main, with pre-deploy lint and test steps.

**Done when:** Merge to main produces a successful deploy. Rollback path documented in `/docs/` or the wiki.

---

## Dashboard

### DASH-1a: Frontend folder structure and page stubs
*(label: sub-team/dashboard, type/setup)*

Come to consensus on the Dashboard's frontend folder structure. The starting proposal:

```
/dashboard
├── index.html
├── error-detail.html
├── performance.html
├── feedback.html
├── alerts.html
├── settings.html
├── /assets
│   ├── /icons
│   ├── /images
│   └── /fonts
├── /styles            # css files
├── /scripts
│   ├── /components    # reusable UI (nav bar, error cards, etc.)
│   └── /pages
└── README.md          # folder structure + descriptions
```

Stub out empty files in the agreed structure so the eventual shape of the Dashboard is visible. README documents what each folder is for. Note: `performance.html`, `feedback.html`, `alerts.html`, and `settings.html` start empty and fill in across Sprints 3-5 — they are not Sprint 2 deliverables.

**Done when:** Structure agreed in a Dashboard sub-team conversation. Empty files in place. README in `/dashboard/` explains the structure.

### DASH-1b: Dashboard build, dev server, and tooling setup
*(label: sub-team/dashboard, type/setup)*

Dev server, test runner per the Testing ADR, lint inheriting from Process/Docs, and baseline CSS scaffolding — shared variables (colors, spacing), reset stylesheet, layout primitives — that all views import from `/styles/`.

**Done when:** Project serves locally. Tests run (even if empty). Lint passes in CI. Shared CSS scaffolding exists in `/styles/`.

### DASH-2: Implement client-side routing
*(label: sub-team/dashboard, type/feature)*

Vanilla JS routing between project list, error list, and error detail. `history.pushState`-based with a small dispatcher.

**Done when:** Manual navigation between the three routes works. Tests cover dispatcher logic.

### DASH-3: Implement API client module
*(label: sub-team/dashboard, type/feature)*

Centralized module for talking to Backend's read endpoints. Handles auth and basic error states (network failure, 4xx, 5xx).

**Done when:** Views import the API client (not raw `fetch`). Error paths tested with mocked failures.

### DASH-4: Implement project list view
*(label: sub-team/dashboard, type/feature)*

Landing view after login. Lists projects via the API. Clicking a project navigates to its error list. Styled to baseline using the shared CSS from DASH-1b.

**Done when:** Real data from the API renders. Navigation to the error list works. View is legible and consistent with other views. Tests cover render and click handlers.

### DASH-5: Implement error list view
*(label: sub-team/dashboard, type/feature)*

Pulls from `GET /api/errors?project=X`. Displays a sortable list with message, count, last seen. Clicking an error navigates to error detail. Styled to baseline.

**Done when:** Real data renders. Basic sort works. View is legible. Tests cover render and interaction logic.

### DASH-6: Implement error detail view
*(label: sub-team/dashboard, type/feature)*

Single error with captured context (stack trace, URL, timestamp, etc.) per the contract. Styled to baseline.

**Done when:** Real data renders. Navigation back to the error list works. View is legible. Tests cover render logic.

---

## Process/Docs

### DOCS-1: Testing Strategy ADR — *priority, land Day 1-2*
*(label: sub-team/docs, type/adr, priority/high)*

Pick the unit framework (Vitest or `node:test`) and E2E framework (Playwright or alternative). Justify against the vanilla-JS / no-framework constraint — explicitly note that dev-time tooling is allowed even where runtime frameworks aren't. Document how each component runs tests in CI.

**Done when:** ADR merged. Sub-teams can adopt the chosen tooling by Day 2.

### DOCS-2: Versioning and Changelog ADR
*(label: sub-team/docs, type/adr)*

SemVer policy (per-deliverable vs. unified) and changelog approach (manual, automated, or hybrid).

**Done when:** ADR merged. Changelog format and update cadence documented.

### DOCS-3: Product Form Factor ADR
*(label: sub-team/docs, type/adr)*

Document the choice to ship SDK + Worker + web app. Cover alternatives considered (desktop wrapper, REST-only, etc.). Mostly retrospective documentation of a decision the team already made.

**Done when:** ADR merged. Primer references it.

### DOCS-4: Initialize Wiki structure
*(label: sub-team/docs, type/infra)*

Pages: Home, Architecture Overview (placeholder), ADR Index, Contributor Guide stub, Glossary (link to primer). Empty pages acceptable.

**Done when:** Wiki pages exist with the structure above. README links to the wiki.

### DOCS-5: Sprint 2 review and retrospective
*(label: sub-team/docs, type/process)*

Review demos the spine end-to-end. Retro captures what went well, what didn't, and action items.

**Done when:** Meeting held with all team members. Markdown at `/docs/retros/sprint-2.md`. Action items filed as Sprint 3 issues where applicable.

### DOCS-6: Testing app ADR and traffic generation
*(label: sub-team/docs, type/adr)*
 
Write an ADR documenting the testing app choice. Options to consider: vibe-coding a small app from scratch, using the AI slot machine, or accepting an offering from CSE 135. Once the choice is locked, pair with SDK (SDK-6) to deploy the chosen app with the SDK instrumented, then circulate the deployed URL to classmates and friends to generate real traffic. Light synthetic traffic is fine to supplement, but mark it clearly as such.
 
**Done when:** ADR merged. Testing app is deployed and sending events to the deployed Backend. External users (classmates/friends, not just team members) have visited the site and generated at least a handful of real events visible in the Dashboard.

---

## Definition of "Sprint 2 Successful"

By end of sprint (Sunday), all of the following are true:

- **The error spine works end-to-end.** An error thrown in a test page is captured by the SDK, transmitted via the contract, accepted by the deployed Backend, persisted to storage, and visible in the Dashboard's error list and detail views.
- **All three backlog ADRs are merged:** Testing (DOCS-1), Versioning (DOCS-2), Form Factor (DOCS-3).
- **Wiki structure is initialized** and linked from the README (DOCS-4).
- **SDK distribution mechanism is operational** and usable from outside the SDK sub-team (SDK-5).
- **CI/CD deploys the Worker to Cloudflare** on merge to main (BE-6).
- **Tests run in CI on every PR** for each of the three components.
- **Sprint 2 retro is held and captured** at `/docs/retros/sprint-2.md` (DOCS-5).

If any of these is missing, the team raises it explicitly in the retro and decides whether to carry it into Sprint 3 or treat it as a process failure to address.

---

## Notes for sprint planning

- **Standing items not listed as issues:** weekly TA meeting, three+ standups, sprint planning meeting (run before Day 1 starts). All captured in the repo per spec but not filed as Sprint 2 issues.
- **Integration day:** designate one day (probably Day 5 or 6) where SDK, Backend, and Dashboard mob on integration so the spine actually works end-to-end before the review. Three components built in parallel rarely fit together cleanly on the first try.
- **If a sub-team finishes early:** do not pull Sprint 3 work forward. Harden what's built — more tests, error handling edge cases, integration polish, JSDoc completeness — so Sprint 3 starts on a clean foundation.