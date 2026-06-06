# WatchTower

## About

WatchTower is a small observability platform: developers add an injectable JavaScript SDK to their site, and WatchTower captures runtime errors and performance metrics, surfacing them through a centralized dashboard. Post-MVP goals include user feedback, build signals, and notifications. Think Sentry or LogRocket, but small enough that one person can understand the whole thing end to end.

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

## Project Structure

WatchTower has three deliverables:

- **SDK** (`/sdk`) — the injectable JavaScript library customers add to their websites.
- **Backend** (`/backend`) — Cloudflare Workers that ingest events from the SDK, store them, and serve them to the Dashboard.
- **Dashboard** (`/dashboard`) — the vanilla-JS web app where developers log in to see their data.

  ```
  watchtower/
  ├── .github/
  │   └── workflows/                # CI/CD GitHub Actions pipelines
  ├── backend/                      # Cloudflare Workers API
  │   ├── src/                      # Worker source (routes, middleware, storage)
  │   ├── test/                     # Backend unit tests (Vitest)
  │   ├── migrations/               # D1 database migration SQL files
  │   ├── schema.sql                # Database schema
  │   └── wrangler.toml             # Cloudflare deployment config
  ├── dashboard/                    # Vanilla-JS developer dashboard (Cloudflare Pages)
  │   ├── *.html                    # Page files (login, errors, performance, etc.)
  │   ├── scripts/                  # Page logic, API client, shared utilities
  │   ├── styles/                   # CSS (globals, components, layout, per-page)
  │   └── tests/                    # Dashboard unit tests (Node test runner)
  ├── docs/
  │   ├── adr/                      # Architectural Decision Records (MADR format)
  │   ├── sprints/                  # Per-sprint goal and deliverable overviews
  │   ├── ucd/                      # Design brief and UCD artifacts
  │   └── PROJECT-PRIMER.md         # Start here — architecture, teams, agreements
  ├── e2e/                          # Playwright end-to-end tests
  ├── sdk/
  │   └── watchtower-sdk/src/       # Injectable JS library (error, log, performance capture)
  ├── eslint.config.js              # Linting rules (JS, HTML, CSS)
  ├── playwright.config.cjs         # E2E test configuration
  ├── package.json                  # Root scripts (lint, test, e2e)
  └── CHANGELOG.md                  # Notable changes per version

## How to Run

**1. Create a project and get an API key**

Go to the [WatchTower dashboard](#), sign in, and create a new project. You'll receive an API key.

**2. Install the SDK**

```sh
npm install github:cse110-sp26-group06/watchtower
```

**3. Initialize WatchTower in your site**

```js
import { initWatchtower } from 'watchtower-sdk';

initWatchtower({
  apiKey: 'your-api-key',
  service: 'my-app',
  environment: 'production',
});
```

That's it. WatchTower will automatically capture JavaScript errors and performance metrics and send them to your dashboard.

## Issues Running?

**No data showing up on the dashboard** — make sure `initWatchtower()` is called before any other code runs and that the `apiKey` matches the project you created. Errors are batched and sent on a short timer, so allow a few seconds after triggering an event.

**Dashboard won't log in / shows no projects** — try going through the onboarding page to create a fresh project. If you previously saved a project to `localStorage`, clearing site data and starting over usually resolves stale state.

## Documentation

| Doc | Purpose |
|---|---|
| [Project Primer](docs/PROJECT-PRIMER.md) | Architecture, sub-teams, working agreements, glossary. **Read this first.** |
| [Design Brief](docs/ucd/DESIGN-BRIEF.md) | MVP, target users, scope. |
| [ADR Index](docs/adr/index.md) | All architectural decision records. |
| [Sprint Overviews](docs/sprints/) | Per-sprint goals and sub-team deliverables. |
| [Changelog](CHANGELOG.md) | Notable changes per version. |

For deeper docs, see the project [Wiki](#) *(link forthcoming)*.

## Team

WatchTower is built by Group 06 of CSE 110, Spring 2026.

| Sub-team | Members |
|---|---|
| Client SDK | Aidan, Maxime |
| Backend | Arpita, Kevin, Ethan |
| Dashboard | Stephanie, Dishita, Sean |
| Process / Docs | Zayn, Nicholas |

## License

This is a class project for **CSE 110 (Software Engineering)** at UC San Diego, Spring 2026. 