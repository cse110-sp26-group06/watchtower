# Pick Versioning and Changelog Approach

## Status

- [ ] Pending
- [ ] Rejected
- [x] Accepted

## Context and Problem Statement

The project spec requires using SemVer and maintaining a changelog (manual, automated, or hybrid). We need a versioning strategy and changelog approach that fits how we actually release.

## Decision Drivers

- Simplicity for a single-team, short-timeline project
- Spec compliance: SemVer + maintained changelog
- Resilience against imperfect commit-message discipline (Conventional Commits are encouraged but maybe not consistent in practice)
- Minimal CI and setup overhead

## Considered Options

**Versioning**
- Per-deliverable SemVer (e.g. `sdk@0.3.1`, `backend@0.5.0`), each component versioned independently
- Unified SemVer — one `v0.x.y` for the repo, all three components advance together

**Changelog**
- Manual — team writes entries at release time
- Automated — tools like release-please or semantic-release generate entries from Conventional Commits
- Hybrid — auto-generate, then manually curate before release

## Decision Outcome

**Versioning: unified.** One `v0.x.y` tag per release on the repo. The SDK's `package.json` version mirrors the project tag so external consumers (npm) see a SemVer-meaningful version. Backend and Dashboard don't have external consumers, so independent versions would add bookkeeping for no benefit. The versioning scheme will be as follows:

0.1.0 → error pipeline end-to-end \
0.2.0 → performance capture \
0.3.0 → feedback widgets \
0.4.0 → notifications + build signals

*Note*: The 0.3.0 and 0.4.0 implementation targets above were revised by [ADR 0009](/docs/adr/0009-final-release-scope.md). The guaranteed MVP release scope is 0.1.0 (error pipeline) and 0.2.0 (performance). Features in 0.3.0 and 0.4.0 (notifications, feedback, GitHub Issues integration) will be attempted if time permits. Any incomplete work will be preserved on feature branches and documented in the project Wiki rather than held as a release blocker.

**Changelog: manual.** Entries added to `CHANGELOG.md` at release time, using the Keep a Changelog format already scaffolded in Sprint 1. Releases align with sprint ends, so changelog updates happen roughly once a week.

### Pros
- No setup cost, no tool dependency, no additional CI to maintain
- Doesn't rely on commit messages being perfectly formatted, entries are written from a release-time review of what shipped
- Aligns with the team's actual release pattern (the three components ship together, not independently)
- Keep a Changelog scaffolding already exists in the repo from Sprint 1
- SDK consumers see a meaningful version via the unified tag flowing into the SDK package

### Cons
- If a component ever needs an independent release (e.g. patching the SDK without bumping the others), we'd need to revisit this decision
- Manual changelog relies on discipline at release time — if it's forgotten, it's worse than automated would have been