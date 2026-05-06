# Sprint 1 Overview

*Design & Prototyping Sprint · CSE 110 · Group 06*

## Sprint Goal

Pass the TA's design gate, lock the foundational technical contracts, and validate the architecture end-to-end with throwaway spikes — so Sprint 2 can start building real code on day one.

## Mental Model for the Sprint

Sprint 1 is the only sprint where **no production code is written.** Every sub-team is producing design artifacts and disposable prototypes. The pattern across all four sub-teams is the same:

- **Dashboard** designs what the product *looks like* (wireframes).
- **SDK** designs how a customer *uses* the product (API surface).
- **Backend** designs how the components *talk to each other* (ingestion contract + infrastructure).
- **Process/Docs** sets up the *infrastructure of working* on the project (CI, linting, repo housekeeping).

If the sprint succeeds, Sprint 2 starts with a clear contract between every component and a validated technical foundation.

---

## Client SDK

Three deliverables, none of which is real product code.

**SDK API design document.** A written proposal for how a customer *uses* WatchTower in their site. Not "here's the implementation" — "here's the public surface we're going to build." It should look like a spec or a README preview, with code samples showing what `watchtower.init({...})` accepts, what other methods exist (`captureError`, `identify`, etc.), what's auto-captured silently, and what the customer has to opt into. Output is a markdown file in `/docs/`

**Throwaway error-capture prototype.** A single small JavaScript file that does *one* thing: catches a `window.onerror` event and POSTs the error data as JSON to a hardcoded URL. Not modular, not tested, not polished — its job is to prove the path works on the platforms we picked. About 30-50 lines of code, lives in `spikes/` so everyone knows it's disposable.

**SDK distribution ADR.** A short MADR document deciding whether we publish as an npm package, host from a CDN, both, or something else. Includes pros, cons, and the chosen path. Follow MADR format.

**End-of-sprint state:** SDK has produced an API design doc, a working-but-disposable prototype, and a documented distribution decision. Sprint 2 starts with all three as inputs to the real implementation.

---

## Backend

Four deliverables, also no real product code.

**cse135.site research note.** The prof said to study it heavily. One Backend member walks through the site and writes a 1-2 page markdown summary of what's there and which patterns apply to WatchTower — data ingestion, Cloudflare usage, storage shape. Becomes a shared reference for the whole team, not just Backend.

**Infrastructure ADR.** The foundational technical decision: where does the Backend run, where does data live. Output is a MADR document specifying the runtime (Cloudflare Workers) and storage (D1, KV, or hybrid), with rejected alternatives and reasoning. This drives everything Backend does in Sprint 2.

**Ingestion contract — co-designed with SDK.** The most important Backend deliverable. Defines the exact JSON shape the SDK sends, the endpoints those POSTs go to, how authentication works, and what the Backend responds with. Both sub-teams agree on this *before* either writes real code, because changing it later means both teams redo work. Output is one markdown file at `/docs/contracts/ingestion.md`, jointly owned.

**Throwaway Backend prototype.** Mirror of the SDK spike. One small Cloudflare Worker that accepts the SDK spike's POST, writes the data somewhere (D1, KV, or even `console.log`), and returns 200 OK. Validates the path SDK → Worker → storage works on our chosen platform. Disposable, lives in `spikes/`.

**End-of-sprint state:** Backend has confirmed the platform works, locked the contract that SDK depends on, and produced the infrastructure ADR that unblocks Sprint 2 implementation.

---

## Dashboard

Three deliverables, all design artifacts.

**Wireframes for the core dashboard views.** Low-fidelity sketches of the screens a developer sees when they log in: error list, error detail, performance overview, feedback inbox, project settings. Low-fi means boxes, labels, and arrows — not pixel-perfect visual design. Figma, Excalidraw, or hand-drawn photos all count. Goal is shared understanding of *what's on each screen*, not what colors or fonts to use. Output is a Figma file shared with the team, plus screenshots committed to `/docs/wireframes/`.

**Wireframes for the notification configuration UX.** Notifications are the trickiest UX in the product — the whole point of WatchTower is "smart, not spammy" notifications, and that depends on the customer being able to configure them. Wireframes cover how a user sets up notification rules, chooses channels (email, Slack, webhook), and manages existing rules. Sketch the full path from "I want to set up an alert" to "alert is live."

**Document listing the read APIs Dashboard needs from Backend.** Once wireframes exist, Dashboard knows what data each screen needs — and that becomes a list of endpoints they're requesting from Backend. For example: "the error list page needs `GET /api/errors?project=X&since=Y` and expects an array of error summaries with these fields." Output is a markdown file at `/docs/dashboard-api-needs.md`, handed to Backend before Sprint 2.

**Important note on scope:** wireframes are not visual design. Don't get pulled into picking colors, fonts, or animations this sprint. That's a later concern once the structure is locked. Sprint 1 is about *what's on the screen*.

**End-of-sprint state:** Dashboard can point at any screen in their wireframes and say "this is what the user sees, and this is the data we need from Backend to render it."

---

## Process/Docs

Four deliverables plus a cross-cutting coordination role.

**Repository housekeeping.** The literal foundation everyone builds on: comprehensive `.gitignore`, empty `CHANGELOG.md` in Keep a Changelog format starting at `0.0.1`, `README.md` skeleton, empty `/docs/adr/` folder with an `index.md`, and the existing `PROJECT-PRIMER.md` dropped into `/docs/`. Single PR landing within the first two days of the sprint so other work isn't blocked.

**PR template at `.github/pull_request_template.md`.** Pre-fills the description box every time someone opens a pull request. Includes the Definition of Done checklist from the project primer, an AI usage disclosure section, a "what does this change" section, and a "how to test" section. Lands in the first three days of the sprint.

**Combined linting and CI workflow setup.** Two pieces bundled as one effort:

- Configure ESLint, Prettier, and markdownlint with sensible defaults, add `npm run lint` script, document in README. *(TA approval required for these dependencies — confirm early.)*
- Create `.github/workflows/ci.yml` running `npm run lint` on every PR. Add a status badge to the README.

The largest Process/Docs work this sprint. Plan a full day or two of focused effort, ideally paired with someone from another sub-team so the linter rules don't only reflect Process/Docs preferences.

**Sprint 1 review and retrospective.** End-of-sprint meeting capturing what went well, what didn't, and action items for Sprint 2. The review is the demo to ourselves of what Sprint 1 produced. Both captured as markdown at `/docs/retros/sprint-1.md`. Action items become Sprint 2 issues where applicable.

### Coordination role (not a discrete deliverable)

In addition to the four deliverables above, Process/Docs handles the work that doesn't show up as discrete issues:

- **Unsticking blockers** when sub-teams are waiting on each other.
- **Hopping in on other teams' work** once their own deliverables are landed — pair on whatever needs the most help.

**End-of-sprint state:** the infrastructure of working on the project feels solid. CI runs, PRs have templates, standups are captured, the repo has structure, and other sub-teams can focus on their work without scaffolding distractions.

---

## Definition of "Sprint 1 Successful"

By Sunday end-of-sprint, all of the following are true:

- Design brief, personas, user stories, and wireframes exist in the repo and pass the TA gate.
- The Infrastructure ADR and SDK distribution ADR are merged.
- The ingestion contract is committed and referenced by both SDK and Backend spikes.
- Both spikes exist and have been demonstrated to work end-to-end together.
- The repo has a working CI pipeline running lint on every PR.
- Sprint 1 retro is held and captured.

If any of these is missing, the team explicitly raises it in the retro and decides whether to carry it into Sprint 2 or treat it as a process failure to address.

---

*This overview is a living document for the sprint. If sprint scope changes meaningfully (e.g., a deliverable is descoped or added), update this doc in the same PR as the change. Future sprints will use this same template — see `docs/sprints/` for the pattern.*