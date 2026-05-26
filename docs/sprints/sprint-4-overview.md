# Sprint 4 Overview

*Integration, Product Coherence, and Performance Progress · CSE 110 · Group 06*

## Sprint Goal

Complete the remaining error-pipeline integration work, improve the dashboard's product coherence, and make concrete progress on performance capture so the project moves closer to a credible `0.1.0` error milestone and visible momentum toward `0.2.0`.

## Mental Model for the Sprint

Sprint 4 is a convergence sprint. Earlier sprints established the basic architecture, the initial dashboard flows, the backend ingestion/read paths, and the SDK pipeline structure. This sprint focuses on making those pieces work together more cleanly while extending the product in a controlled way.

The pattern across the four sub-teams is:

- **Dashboard** makes the existing product more real and more coherent by finishing error-detail integration, adding the resolve flow, building the first performance screen, and applying branding.
- **Backend** supports the Dashboard's next layer of work by tightening authentication and project ownership, stabilizing project/API-key flows, and continuing the performance data path.
- **SDK** extends the pipeline beyond basic error capture into logs and spans/performance, while adding test coverage for the now more-complex parsing and batching logic.
- **Process/Docs** completes the remaining maintainer-facing infrastructure and supports integration work where the project most needs it.

If the sprint succeeds, the project ends the week with a more trustworthy error-monitoring flow, a clearer project/auth story, a more polished dashboard, and a thinner but realer performance slice.

---

## Client SDK

Four deliverables for Sprint 4.

**Log pipeline.** Extend the SDK pipeline so log events can be normalized, batched, and sent through the same general transport pattern as errors. The goal is not to invent a large telemetry platform, but to add a real second event type to the existing SDK structure.

**Span / performance pipeline.** Continue the SDK's performance work by turning span/performance support into a real event path that the Backend can ingest. Keep the implementation narrow enough that it can be consumed by the rest of the system this sprint.

**Unit tests for parsing and batching.** The SDK now has enough internal logic that it should not depend only on manual browser testing. Add repeatable unit coverage for parsing behavior, queueing behavior, and flush behavior so regressions are easier to catch.

**Contract alignment with Backend.** As the Backend continues tightening endpoint and schema behavior, keep SDK payloads aligned with the current contract for error, log, and performance events. This is integration work, not just isolated SDK implementation.

**End-of-sprint state:** SDK supports errors, logs, and performance-oriented spans through a consistent batching/transport model, with basic unit coverage on the core internal logic.

---

## Backend

Four deliverables for Sprint 4.

**Authentication and project ownership.** Strengthen the project's auth/project story so the Dashboard is not built around shared, ambiguous access forever. The goal is a workable backend-backed ownership model that the Dashboard can rely on, not a production-grade auth platform.

**Support for project and API-key flows.** The Dashboard now includes onboarding and project-selection flows. Backend should provide stable support for project creation, API-key generation, and whatever scoping rules the Dashboard needs to function coherently this sprint.

**Performance capture support.** Continue building out the performance data path on the Backend side. This includes the pieces needed to accept, validate, store, and expose basic performance-related data in a way the Dashboard can begin consuming.

**Backend clarity and maintainability.** Improve the understandability of the backend code and data flow through better structure, comments, or short supporting documentation. This reduces the risk of backend work becoming a bottleneck simply because too few people can navigate it confidently.

**End-of-sprint state:** Backend provides a clearer auth/project model, supports the Dashboard's project/API-key workflow, and advances the performance path beyond ingestion-only scaffolding.

---

## Dashboard

Five deliverables for Sprint 4.

**Branding direction and application.** Define the dashboard's branding direction, including visual theme, palette, and logo treatment, and document it in [docs/ucd/UCD.md](/Users/zaynashraf/watchtower/docs/ucd/UCD.md:1). Apply that direction to the existing Dashboard UI so the product looks more intentional and consistent.

**Error detail page API integration using event ID.** Finish the in-progress work to load error detail data through the intended backend-by-ID API path rather than relying on indirect list behavior or mock-first logic.

**Resolved / unresolved flow.** Implement marking errors as resolved through the backend PATCH path and make sure the unresolved list reflects that change correctly when users navigate back from the detail page.

**Performance view.** Set up the first performance screen. Mock data is acceptable while backend performance endpoints are still stabilizing, but the page structure should be designed so real data can replace the mock path without major rework.

**Projects / onboarding coherence.** Keep the onboarding and projects flow aligned with the current auth and project model so that login, project selection, API-key generation, and movement into the main dashboard feel like one connected product path.

**End-of-sprint state:** Dashboard has a more coherent visual identity, a stronger error-detail/resolve flow, a first performance page, and a clearer path from login to project-specific dashboard usage.

---

## Process/Docs

Four deliverables plus a support role.

**Technical documentation site for maintainers.** Launch the project's maintainer-facing documentation site, most likely through the GitHub Wiki unless the team has chosen a private docs site. It should explain how the system is structured and how future maintainers work on it, not just act as a placeholder.

**Testing app traffic generation.** Help make the testing app useful as a shared integration environment by ensuring it is being used to generate meaningful traffic for error and, where possible, performance flows.

**Quarter logistics.** Coordinate remaining process/logistics work needed for the quarter, including meetings or checkpoints that should not be left to the last minute.

**Release/changelog readiness.** Keep the changelog and other project-facing docs current enough that the team can make a clean call on whether the error pipeline is ready to be treated as a milestone.

### Support role

Once the remaining Process/Docs deliverables are covered, this sub-team should spend time helping whichever technical area is blocking progress most, especially around integration clarity between Backend and Dashboard.

**End-of-sprint state:** maintainer documentation is live, the testing app is contributing useful traffic, project logistics are under control, and Process/Docs capacity is being used to support delivery where needed.

---

## Definition of "Sprint 4 Successful"

By end of sprint (Sunday), all of the following are true:

- The error detail and resolve flows work through the intended backend paths.
- The Dashboard has a documented branding direction and visible UI updates reflecting it.
- The project/auth/API-key flow is clearer and more coherent than it was at the start of the sprint.
- Logs and performance/spans have moved forward in the SDK and Backend enough to count as real implementation progress rather than design intent.
- The technical documentation site for maintainers is live and linked from the repo.

If several of these are still ambiguous by the end of the sprint, the team should treat that as a sign that integration and product coherence still need more attention than new surface area.

---

*This overview is a living document for the sprint. If sprint scope changes meaningfully, update this doc in the same PR as the change. See `docs/sprints/` for prior sprint patterns.*
