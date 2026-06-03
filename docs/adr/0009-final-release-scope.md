# Revise Final Release Scope

## Status

- [ ] Pending
- [ ] Rejected
- [x] Accepted

## Context and Problem Statement

The original versioning plan in ADR 0005 described four staged milestones:

- `0.1.0` -> error pipeline end-to-end
- `0.2.0` -> performance capture
- `0.3.0` -> feedback widgets
- `0.4.0` -> notifications and build signals

As the project approached the end of the quarter, the team no longer had enough implementation time to complete all four milestones to an acceptable standard. Continuing to treat feedback widgets, notifications, and build signals as near-term release goals would spread the team across too many partially finished features.

## Decision Drivers

- Remaining project time is limited
- Error monitoring is the core WatchTower workflow
- Performance monitoring is the next highest-value observability workflow
- A smaller completed scope is preferable to a broader incomplete scope
- Documentation and release notes should reflect the work the team can honestly deliver

## Considered Options

**Keep the original four-milestone plan.** Continue targeting errors, performance, feedback widgets, and notifications/build signals.

**Reduce final implementation scope to errors and performance.** Treat feedback widgets, notifications, GitHub issue creation, and build-signal integrations as future or stretch work.

**Cut performance as well and finish only errors.** Focus all remaining effort on error monitoring.

## Decision Outcome

We will reduce the final implementation scope to **error monitoring** and **performance monitoring**.

The revised milestone plan is:

- `0.1.0` -> error pipeline end-to-end
- `0.2.0` -> performance capture and dashboard visibility

The following features remain documented as post-MVP or stretch work:

- feedback widgets and feedback inbox
- notification rules and notification delivery
- GitHub issue creation
- build-signal / deployment integrations

This decision revises the release scope described in ADR 0005. ADR 0005 still governs the team's unified SemVer and manual changelog approach, but this ADR supersedes its original `0.3.0` and `0.4.0` implementation targets.

### Pros

- Gives the team a realistic final target
- Improves the odds that the delivered features are integrated and demonstrable
- Keeps the project focused on its strongest observability use cases
- Makes release notes and project docs more honest about what is in scope

### Cons

- Feedback widgets and notifications were part of the original MVP ambition
- Some existing design artifacts and placeholder pages will remain ahead of the implemented product
- Future maintainers will need to revisit the deferred features if the project continues

## Confirmation

Compliance is confirmed when the project docs and changelog describe errors and performance as the final implementation target, while marking feedback, notifications, GitHub issue creation, and build-signal integrations as stretch or post-MVP work.
