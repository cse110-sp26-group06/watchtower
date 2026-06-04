# WatchTower — Design Brief

*Sprint 1 · CSE 110 · Group 06*

## Problem

Developers shipping software to production lose visibility into what their applications are actually doing. Errors go uncaught, performance degrades silently, and user complaints scatter across emails and support tickets. Existing tools like Sentry and PostHog solve this at scale, but they're heavy, expensive, and overwhelming for smaller teams who just want to know when something is wrong — without being paged for every minor issue.

## Target Users

**The startup founder.** Someone running their own small product who wants meaningful oversight of their software's health. They need to know when something is breaking, but not for every single error. Alert fatigue is a real concern; they'd rather miss noise than miss signal.

**The working developer.** Someone debugging issues in code they've shipped. They want clear root-cause analysis: which deployment introduced the bug, what was happening when it occurred, whether it's still occurring. They don't want to comb through logs; they want answers.

## Core Value Proposition

WatchTower is an observability tool that's lightweight, free, and focused. No subscription, no enterprise feature creep — just the essentials needed to catch issues in production software when it first starts out.

## Scope

### In Scope

**SDK** — Captures JavaScript runtime errors and performance metrics in customer websites. Batches events and sends them to the Backend. Designed to never crash the host site.

**Backend** — Handles authentication and API keys. Exposes the read APIs the Dashboard consumes. Delivers notifications. End users never hit it directly.

**Dashboard** — A web app developers log into. Lists projects, errors, performance metrics, and user feedback. Supports drilling into individual events. Surfaces notification rules and integration configuration. Owns all client-side UI/UX.

### Out of Scope (for now)

- Mobile or desktop native apps
- Multi-tenant enterprise features
- Long-term log retention or analytics warehousing
- Anything beyond browser-based JavaScript instrumentation

## Success Criteria (MVP)

By the end of the project, WatchTower can:

- Capture and surface **errors** thrown in customer applications
- Detect and surface **performance degradation**
- Collect and surface **user feedback** through simple rating widgets or feedback forms
- Integrate with **build signals** so a developer can identify which deployment introduced a regression
- **Notify** the developer through configured channels when something meaningful happens — not for every event

**NOTE: Due to time constraints, user feedback, build signals, and notifications were moved to Post-MVP/Stretch goals rather than MVP goals. See [index.md](../adr/index.md) for decision regarding our final release scope.**

## Post-MVP / Stretch

Larger or recurring issues can be escalated into GitHub Issues automatically, dropping straight into the developer's existing workflow without requiring them to log into the WatchTower dashboard.

## Team Assignments

| Sub-team | Size | Members |
|---|---|---|
| Client SDK | 2 | Aidan, Maxime |
| Backend | 3 | Arpita, Kevin, Ethan |
| Dashboard | 3 | Stephanie, Dishita, Sean |
| Process / Docs | 2 | Zayn, Nicholas |

---

*This brief is the project's roadmap. If decisions made later contradict it, either the brief or the decision needs to change — both can't be right.*
