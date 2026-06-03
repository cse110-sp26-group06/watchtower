# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning will be as follows:

0.1.0 → error pipeline end-to-end \
0.2.0 → performance capture \
0.3.0 → feedback widgets \
0.4.0 → notifications + build signals

NOTE: Versions 0.3.0 and 0.4.0 are no longer part of MVP, they are Post-MVP/Stretch goals for future maintainers

## [Unreleased]

### Added
- Dashboard API client module.
- Backend `GET /api/errors` endpoint for listing project errors with query-based filtering.
- Backend endpoints for single-error detail and persisted error resolution:
  - `GET /api/errors/:id`
  - `PATCH /api/errors/:id`
- SDK initialization API (`initWatchtower(...)`) and manual error capture entrypoint.
- SDK batching engine and transport layer for sending error, log, and span batches to the backend.
- Additional dashboard/API test coverage for the error detail flow.
- Dashboard onboarding/projects flow for generating API keys and managing project selection.

### Changed
- SDK event schemas for errors, logs, and spans were revised during implementation to remove redundant fields and better match accessible runtime data.
- The SDK pipeline is now structured as: data capture -> data parsing -> batching -> API call.
- Dashboard authentication direction changed from hardcoded accounts and shared access toward a basic authentication flow that can map users to their own projects.
- Dashboard error views were expanded from mock-first prototypes toward real backend-backed list/detail flows, including filtering and per-error resolution.
- Dashboard error detail flow was updated to load individual events by ID through the backend API rather than deriving detail data only from the error list.
- 

### Deprecated
-

### Removed
-

### Fixed
- Dashboard can now request a single error's detail view through a dedicated backend endpoint instead of relying only on list data.

### Security
-

---

*Versions will be tagged starting at `0.1.0` once the first MVP-relevant feature (error pipeline) lands.*
*See [docs/adr/index.md](docs/adr/index.md) for the ADR governing our versioning policy.*
