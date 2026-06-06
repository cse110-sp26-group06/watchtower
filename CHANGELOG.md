# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning will be as follows:

0.1.0 → error pipeline end-to-end \
0.2.0 → performance capture

Stretch goals being pursued time-permitting (not part of confirmed MVP): feedback widgets, notifications, GitHub Issues integration, build signals. See [ADR 0009](docs/adr/0009-final-release-scope.md).

## [Unreleased]

*(Performance capture and dashboard visibility — target 0.2.0)*

### Added
- SDK performance capture via `PerformanceObserver` (resource, paint, and navigation entries) with `capturePerformance()` entrypoint.
- Backend `/ingest/performance` endpoint for receiving performance events from the SDK.
- Backend `GET /api/performance` read endpoint with filtering by entry type, timestamp, and pagination.
- Dashboard performance page showing avg response time, page load, slowest endpoint stats, and a per-hour response time chart.

---

## [0.1.0] - 2026-06-05

### Added
- Dashboard API client module.
- Backend `GET /api/errors` endpoint for listing project errors with query-based filtering.
- Backend endpoints for single-error detail and persisted error resolution:
  - `GET /api/errors/:id`
  - `PATCH /api/errors/:id`
- SDK initialization API (`initWatchtower(...)`) and manual error capture entrypoint.
- SDK batching engine and transport layer for sending error, log, and span batches to the backend.
- Dashboard onboarding/projects flow for generating API keys and managing project selection.
- Additional dashboard/API test coverage for the error detail flow.

### Changed
- SDK event schemas for errors, logs, and spans revised to remove redundant fields and better match accessible runtime data.
- SDK pipeline structured as: data capture → data parsing → batching → API call.
- Dashboard authentication moved from hardcoded accounts to a basic auth flow mapping users to their own projects.

---

*See [docs/adr/index.md](docs/adr/index.md) for the ADR governing our versioning policy.*
