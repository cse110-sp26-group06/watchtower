# Pick Testing Frameworks

## Status

- [x] Pending
- [ ] Rejected
- [ ] Accepted

## Context and Problem Statement

We need both unit and E2E testing demonstrated throughout the project, not only at the end. We need to pick frameworks that work across all three components and integrate cleanly with our GitHub Actions CI. 

## Decision Drivers

- One framework across components, since contributors may rotate between sub-teams
- Backend tests should run against the actual Cloudflare Workers runtime, not a mock
- SDK runs in unknown customer browsers, so E2E framework needs real cross-browser coverage
- Low onboarding cost, fast and easy to use

## Considered Options

**Unit testing**
- Vitest (with `@cloudflare/vitest-pool-workers` for Backend)
- `node:test` — built into Node, zero dependencies
- Jest — popular but weaker ESM and Workers story
- Mocha + Chai — classic combination, more configuration upfront

**E2E testing**
- Playwright — cross-browser (Chromium, Firefox, WebKit)
- Cypress — single-browser primary mode, heavier
- Puppeteer — Chrome only, lighter but less featured

## Decision Outcome

**Unit:** Vitest across SDK, Worker, and Dashboard. Backend uses `@cloudflare/vitest-pool-workers` so tests run against the real Workers runtime rather than a stubbed environment.

**E2E:** Playwright, configured at minimum for Chromium with the option to add Firefox and WebKit later if SDK reliability work warrants it.

Both integrate via GitHub Actions. Unit tests run on every PR and gate merges. E2E run on PRs touching Dashboard, SDK, or Backend read endpoints i.e. anything that could break the user-visible flow.

### Pros
- One unit framework across all three components means shared patterns, mocking, and matchers
- Vitest's Workers integration tests against the real runtime, which is meaningfully closer to production than the mocked alternatives we considered
- Playwright's cross-browser support directly addresses the SDK's deployment context (customer pages of unknown browsers)
- Vitest API is Jest-compatible, so most online examples and tutorials apply without translation

### Cons
- Two new dev dependencies to justify to the TA, though framing as dev-time tooling is straightforward
- Playwright's first-run browser downloads add CI time on cold runs (mitigated by caching)
- Slightly heavier setup than `node:test` would have been for the simpler components, but the consistency benefit outweighs the marginal cost