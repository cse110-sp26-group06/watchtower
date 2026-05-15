# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Versioning will be as follows:

0.1.0 → error pipeline end-to-end 
0.2.0 → performance capture
0.3.0 → feedback widgets
0.4.0 → notifications + build signals -->

## [Unreleased]

### Added
- Initial repository structure and project documentation.
- Project Primer (`docs/PROJECT-PRIMER.md`) covering architecture, sub-teams, working agreements, and glossary.
- Design Brief (`docs/DESIGN-BRIEF.md`) covering MVP and target users.
- Sprint 1 overview (`docs/sprints/sprint-1-overview.md`).
- Sprint 2 overview (`docs/sprints/sprint-2-overview.md`).
- ADR index and scaffolding (`docs/adr/`).
- Pull request template (`.github/PULL_REQUEST_TEMPLATE.md`).
- Linting setup with ESLint + ADR.
- Playwright E2E foundation.
- SDK API design document defining the public surface of `watchtower.init(...)` and related methods.
- SDK Distribution ADR — npm with `github:` install for development, structured npm releases for production.
- Infrastructure ADR — Cloudflare Workers backend with D1.
- Testing Frameworks ADR — Vitest for Backend, node:test for SDK and Dashboard, Playwright for E2E.
- cse135.site research note.
- Ingestion contract between SDK and Backend (`docs/contracts/ingestion.md`).
- Dashboard wireframes for core views and notification configuration (`docs/wireframes/`).
- Dashboard API requirements document (`docs/dashboard-api-needs.md`).

### Changed
- API endpoints were changed from 3 to 1? (double check with backend & sdk teams to make sure)

### Deprecated
-

### Removed
-

### Fixed
-

### Security
-

---

*Versions will be tagged starting at `0.1.0` once the first MVP-relevant feature (error pipeline) lands.*
*See [docs/adr/index.md](docs/adr/index.md) for the ADR governing our versioning policy.*