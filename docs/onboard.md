# WatchTower Onboarding Guide

This document covers how to access the repo, get your local environment set up, run the build pipeline locally, and make your first change. It supplements the video walkthrough where time doesn't allow for full detail.

---

## Accessing the Repo

The repo is at [github.com/cse110-sp26-group06/watchtower](https://github.com/cse110-sp26-group06/watchtower).

Clone it:

```sh
git clone https://github.com/cse110-sp26-group06/watchtower.git
cd watchtower
```

---

## Prerequisites

- **Node.js v20+** — the CI pipeline uses Node 20; older versions may work but aren't tested.
- **npm** — comes with Node.

Check your versions:

```sh
node -v   # should be v20.x or higher
npm -v
```

---

## Install Dependencies

From the repo root:

```sh
npm install
```

This installs ESLint, Playwright, and all other dev dependencies listed in `package.json`.

The backend has its own dependencies (Vitest, Wrangler). To run backend tests locally, install them separately:

```sh
cd backend && npm install
```

---

## Repo Structure

WatchTower has three deliverables and one docs directory:

```
watchtower/
├── .github/workflows/     # CI: linting, E2E tests, backend deploy
├── backend/               # Cloudflare Workers API (Vitest for tests)
├── dashboard/             # Vanilla-JS web app (Node test runner)
├── sdk/                   # Injectable JS library
├── docs/                  # ADRs, sprint overviews, this file
├── e2e/                   # Playwright end-to-end tests
├── eslint.config.js       # Linting rules for JS, HTML, and CSS
└── CHANGELOG.md
```

---

## Running the Build Pipeline Locally

### Linting (ESLint)

Runs on all `.js`, `.html`, and `.css` files:

```sh
npm run lint
```

To auto-fix fixable issues:

```sh
npm run lint:fix
```

### Dashboard Unit Tests

```sh
npm run test:unit
```

### Backend Unit Tests

```sh
cd backend
npm run test
```

### End-to-End Tests (Playwright)

First-time setup — install the Chromium browser:

```sh
npx playwright install chromium
```

Then run:

```sh
npm run test:e2e
```

To run with the Playwright UI (useful for debugging):

```sh
npm run test:e2e:ui
```

---

## CI/CD: What Runs Automatically

Three GitHub Actions workflows run automatically on push and pull requests to `main`:

| Workflow | Trigger | What it does |
|---|---|---|
| **ESLint** | Every push / PR to `main` | Lints all JS, HTML, CSS; uploads results to GitHub Security tab |
| **E2E Tests** | PR or push when SDK/backend/dashboard files change | Runs Playwright tests in CI |
| **Deploy Backend** | Push to `main` when `backend/` changes | Deploys backend to Cloudflare Workers automatically |

The dashboard deploys to GitHub Pages automatically on push to `main`.

---

## Making a Change and Seeing the Build Complete

1. **Create a branch:**

   ```sh
   git checkout -b docs/my-small-change
   ```

2. **Make a change** — a comment, a doc fix, anything.

3. **Run lint locally first:**

   ```sh
   npm run lint
   ```

4. **Commit and push:**

   ```sh
   git add <file>
   git commit -m "docs: small example change"
   git push origin docs/my-small-change
   ```

5. **Open a pull request** on GitHub.

6. **Watch the checks run** — on the PR page, the ESLint and Playwright workflows will appear under the checks section. A green checkmark on both means the build passed and the PR is ready to merge.

---

## Deploying

- **Backend:** Merging to `main` with any changes inside `backend/` automatically triggers a Cloudflare Workers deploy via the `deploy.yml` workflow. No manual step needed.
- **Dashboard:** Merging to `main` automatically deploys to GitHub Pages.
- **SDK:** Installed directly from GitHub — no publish step. Customers run `npm install https://github.com/cse110-sp26-group06/watchtower`.