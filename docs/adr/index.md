# Architectural Decision Records

This folder contains all Architectural Decision Records (ADRs) for the WatchTower project. Every major technical decision the team makes is captured here so that future maintainers can understand what was decided and why.

## Format

We use **MADR** (Markdown Any Decision Records) format. Each ADR is a short markdown file covering:

- **Context** — What's the situation that prompted this decision?
- **Considered options** — What did we look at?
- **Decision** — What did we choose, and why?
- **Consequences** — What does this mean going forward (good and bad)?

ADR files are named `NNNN-short-kebab-case-title.md` where `NNNN` is a zero-padded sequential number (e.g., `0001-infrastructure-and-storage.md`).

## Status Values

Each ADR carries one of the following statuses:

- **Proposed** — Drafted but not yet decided.
- **Accepted** — Decided and in effect.
- **Deprecated** — No longer recommended but historically informative.
- **Superseded by ADR-NNNN** — Replaced by a later decision.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| 0001 | [SDK distribution method](0001-sdk-distribution-method.md) | Accepted | 2026-05-11 |
| 0002 | [Backend infrastructure](0002-backend-infrastructure.md) | Accepted | 2026-05-11 |
| 0003 | [Testing framework](0003-testing-framework.md) | Accepted | 2026-05-11 |
| 0004 | [Linting framework](0004-linting-framework.md) | Accepted | 2026-05-13 |
| 0005 | [Changelog and versioning approach](0005-changelog-and-versioning.md) | Accepted | 2026-05-15 |

## Adding a New ADR

1. Pick the next available number.
2. Copy the [MADR template](https://adr.github.io/madr/) or an existing ADR and rename to `NNNN-your-title.md`.
3. Fill in context, options, decision, and consequences.
4. Open a PR with the new ADR.
5. Update this index in the same PR.
6. Get the ADR reviewed by at least one teammate before merging — for major decisions, mob the discussion before someone scribes it.