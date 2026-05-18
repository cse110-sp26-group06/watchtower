# Sprint 3 — Issues

*Use these as the basis for GitHub Issues. Sub-teams should adjust scope, split, or merge during sprint planning as needed. Suggested labels in parentheses.*

---

## Sprint 3 in context

Sprint 2 was supposed to finish the error path end-to-end. It made real progress, but the job is not fully done yet. Sprint 3 therefore has two goals, in strict priority order:

1. **Finish the error spine for real.** SDK captures, Backend ingests and stores, Dashboard displays real data, and the error detail / resolve flow works without depending on mock-only behavior.
2. **Start the performance spine thinly and intentionally.** Not a full analytics suite. A minimal first slice that proves WatchTower can capture, ingest, store, and display performance data.

This sprint also includes a **mid-sprint rough demo video** showing the project's current state. That means integration has to happen earlier than "Saturday night." If the error spine still is not stable by midweek, the demo becomes harder and the rest of the sprint gets dragged behind it.

The main trade-off this sprint: **do not pull in feedback, notifications, or build signals** until the error path is actually finished and performance has at least one real end-to-end slice working. The repo and ADRs already point to `0.1.0` as the error-pipeline milestone and `0.2.0` as the performance-capture milestone; Sprint 3 should move us cleanly through the first and into the second.

---

## Cross-cutting expectations

The following apply to every issue's Definition of Done and are not tracked as separate issues:

- **Tests.** New behavior ships with tests covering the happy path and the primary failure path, using the framework chosen in the Testing ADR.
- **Lint passing.** `npm run lint` passes before merge. Use `npm run lint:fix` when possible to normalize formatting.
- **Inline documentation.** JSDoc on public APIs and exported functions. Inline comments where logic is not self-explanatory.
- **No disguised mocks.** If a view or flow still depends on mock data, that must be explicit in code and in the PR description. Sprint 3's priority is replacing remaining fake paths in the error pipeline with real integration.
- **Conventional Commits.** Commit messages follow the team convention agreed earlier in the quarter.

End-to-end integration is not a separate "nice to have" for the end of the sprint. It must happen during the sprint because the rough demo depends on it.

---

## Client SDK

### Finish the real error capture and transport path

SDK appears to be furthest along coming out of Sprint 2, so Sprint 3 should focus less on inventing new SDK surface area and more on finishing integration and unblocking the rest of the system. Close whatever remains from Sprint 2 so the SDK's error path is reliable enough for the rough demo and for real integration with the deployed Backend. This includes capture, normalization, batching/flush behavior, and integration against the current auth / endpoint setup.

**Done when:** A controlled error thrown in the testing app reliably reaches the deployed Backend in the agreed contract shape. Unit tests cover the main capture and transport paths, including at least one failure case.

### Implement minimal performance capture

Start performance support with a deliberately narrow scope. Capture a small set of metrics that are easy to reason about and demo, such as page-load timing and the schema already anticipated in the ingestion contract. Do not try to build a full observability SDK in one sprint.

**Done when:** The SDK can emit valid performance events to `/ingest/performance` using the agreed event shape. The chosen metrics are documented in code or `/docs/`.

### Support integration and testing app instrumentation

Once the testing app is running with the SDK embedded, make sure it can generate real error and performance events in a predictable way for Dashboard and demo purposes. If SDK finishes its own core work early, this is the best place for them to pair with Backend or Process/Docs rather than pulling in unrelated new features.

**Done when:** The testing app produces controlled events that show up in Backend storage and are usable in the Dashboard and rough demo.

---

## Backend

### Finish the remaining error read/write workflow

Backend is the most likely blocker for Sprint 3 if Dashboard is still waiting on missing or incomplete endpoints. The first priority is therefore not "more backend features" in the abstract, but finishing the API surface the rest of the project depends on. Complete the parts of the error pipeline that are still partial or inconsistent. This likely includes making sure stored errors can be read back cleanly by Dashboard, supporting the detail view shape, and supporting the resolve/update path the Dashboard already expects.

**Done when:** Error list and error detail both run against real Backend data, and marking an error resolved persists correctly through the Backend rather than only through client-side session state.

### Unblock Dashboard by landing the needed endpoints

Dashboard's Sprint 3 work depends on a real API client, real project data, and real performance data. Backend should explicitly treat those endpoints as dependency work for another sub-team, not as optional polish.

This includes, at minimum:

- Error endpoints stable enough for the list and detail views
- Whatever endpoint or flow the project/API-key generation view depends on
- A clear, documented response shape that Dashboard can code against without guessing

**Done when:** Dashboard can build against real endpoints instead of mocks or speculative response shapes.

### Implement performance ingestion and storage

Build the first real Backend path for performance events. Accept valid performance payloads from the SDK, validate them, and store them in D1 or the chosen storage layer with a schema simple enough to support a minimal Dashboard view.

**Done when:** Real performance events can be written through `/ingest/performance` and read back from storage in a test or manual verification flow.

### Implement a minimal `GET /api/performance` endpoint

Per Dashboard's API needs doc, expose a read endpoint for the first performance view. Keep the response small and practical: enough to render a baseline overview page, not a final analytics product.

**Done when:** Dashboard can request real performance data through a documented endpoint and receive a stable, agreed response shape.

---

## Dashboard

### Implement API client module

This was already on the Dashboard team's tentative Sprint 3 task list and still makes sense. Centralize fetch logic, auth/API-key handling, and error handling for read requests so the views are not each making ad hoc requests.

**Done when:** Dashboard views consume backend data through the shared API client rather than raw scattered fetch calls.

### Implement API key generation and projects view

This also came from the Dashboard team's tentative task list and fits the current project state. A developer needs some path to create or view a project and obtain the API key needed to install the SDK. This should be built against a real Backend flow if possible, not a disconnected mock.

**Done when:** A developer can load the relevant Dashboard view, create or inspect a project, and obtain the API key needed for SDK setup.

### Replace remaining error mocks with real Backend integration

Finish wiring the error list and error detail experience to real Backend data. Any remaining mock-only branches should be removed or left behind only as clearly marked fallback development fixtures. This task is still blocked on Backend delivering stable endpoints, so Dashboard and Backend should plan an explicit handoff early in the sprint.

**Done when:** Error list and error detail load real data by default, and the Dashboard no longer depends on mock data for the main error demo path.

### Finish the resolved/unresolved workflow

The UI for resolving errors already exists conceptually; Sprint 3 should make it real and consistent. The Dashboard should reflect persisted Backend state, not just session-only client state.

**Done when:** A user can mark an error as resolved, refresh or navigate away, and still see the correct resolved state when the page reloads from Backend data.

### Implement performance view

This was on the Dashboard team's tentative task list and aligns with the MVP and versioning plan. Build the first real performance view using the existing wireframes and API-needs doc as guidance. Keep scope tight: a baseline overview page with a few meaningful metrics or cards is enough. Do not spend the sprint polishing charts if the data path is not ready.

**Done when:** A developer can load `performance.html` and see real performance data from the Backend in a legible MVP view.

---

## Process/Docs

### Mid-sprint rough demo video

Prepare and record the rough demo video required during this sprint. This is not a polished final presentation; it is a checkpoint showing the current state of the project honestly. Process/Docs should coordinate the outline, but all sub-teams need to contribute the material.

Suggested demo spine:

- Quick framing of what WatchTower is
- Show the testing app with the SDK installed
- Trigger an error and show it flowing into the Dashboard
- Show the current error detail / resolve flow
- If ready, show the first performance data path; if not, explain what is partially complete and what remains

**Done when:** A rough demo video is recorded and shared by the mid-sprint checkpoint, with the repo state it demonstrates documented in the PR or notes.

### Initialize technical wiki structure

This carried over from the Process/Docs work identified in Sprint 2 and is still useful. Create the baseline wiki structure so there is a stable place for architecture notes, contributor guidance, and project references that do not belong in ADRs.

Suggested initial pages:

- Home
- Architecture Overview
- ADR Index
- Contributor Guide
- Glossary / key project terms

**Done when:** The wiki exists with a usable baseline structure and is linked from the README or other repo entrypoint.

### Product form factor ADR

This also carried over from Sprint 2 and should be finished if it is still outstanding. Document the architectural choice to ship WatchTower as an SDK plus backend plus dashboard, along with the alternatives considered and why they were rejected.

**Done when:** The ADR is merged and the project primer or wiki references it where appropriate.

### Testing app and traffic generation

Help make the testing app useful as a shared integration environment, not just a one-off demo artifact. Coordinate with SDK and Backend to make sure it is deployed, instrumented, and capable of generating both controlled test events and a small amount of real traffic.

**Done when:** The testing app is live, the team has a known URL to use during development and demos, and it is generating visible events in the system.

### Pair with other sub-teams after docs work lands

Process/Docs should explicitly budget time to help unblock feature teams once their own tasks are done. Given the likely dependency shape this sprint, the highest-value support is probably integration help, docs cleanup around Backend/Dashboard contracts, or demo coordination.

**Done when:** Process/Docs has paired on at least one concrete blocker or integration task outside their own direct deliverables.

---

## Definition of "Sprint 3 Successful"

By end of sprint (Sunday), all of the following are true:

- **The error spine is actually complete end-to-end.** An error thrown in the testing app is captured by the SDK, accepted by the Backend, stored, shown in the Dashboard error list, drillable in error detail, and resolvable through a real persisted flow.
- **The Dashboard's main error path does not rely on mock data by default.**
- **Dashboard is no longer blocked on speculative backend contracts.** The needed endpoints and response shapes are real enough that the UI can be built against them directly.
- **A first thin performance path exists end-to-end.** At least one real performance signal is captured by the SDK, ingested by the Backend, stored, and displayed in a minimal Dashboard view.
- **The rough demo video is recorded and shared mid-sprint.**
- **The testing app / shared integration environment is usable by the team.**

---

## Notes for sprint planning

- **Integration needs to happen early.** Do not wait until the weekend to find out whether SDK, Backend, and Dashboard still disagree on event shape or endpoint behavior.
- **Protect scope.** If the error spine is still incomplete, do not let performance work turn into a second half-finished feature.
- **Keep performance intentionally small.** A thin real slice beats a fake analytics dashboard.
- **Use the rough demo as a forcing function.** If a flow cannot be shown honestly in the mid-sprint video, it probably is not integrated enough yet.
