# Pick a JavaScript Style Guide

## Status

- [ ] Pending
- [ ] Rejected
- [x] Accepted

## Context and Problem Statement

The project needs a consistent coding style so the codebase reads like one system instead of a collection of unrelated contributions. The course requirement is consistency first, and Prof Powell specifically called out semicolons, spacing/readability, and strict equality as the important outcomes.

We already use ESLint from ADR 0004, but the repo does not yet have a clearly documented style guide decision or a focused set of style rules that matches the team's goals.

## Decision Drivers

- Consistency across Dashboard, Backend, SDK, and tests
- Low friction for a short-course project with many contributors
- Easy enforcement through ESLint with autofix where possible
- Emphasis on readability over preference-heavy style debates
- JavaScript safety around type coercion and control-flow mistakes

## Considered Options

- **Airbnb JavaScript Style Guide**: mature and well-known, but broader and more restrictive than this project needs
- **Google JavaScript Style Guide**: familiar name, but not a strong fit for a modern JavaScript-only student project
- **Standard JS**: lightweight and easy to use, but conflicts with the team's preference for semicolons
- **WatchTower house style**: a small internal style guide enforced with ESLint rules chosen for readability and safety

## Decision Outcome

We will use a **WatchTower house style** instead of adopting Airbnb, Google, or Standard wholesale.

The enforced rules are intentionally narrow:

- Semicolons are required
- Indentation is 2 spaces
- Object literals use spaces inside braces
- A space is required before blocks
- Keywords must use standard spacing
- `===` and `!==` are required instead of loose equality
- Control-flow statements always use braces
- Unused variables warn
- Console logging is allowed

We are **not** enforcing quote style, maximum line length, underscore naming restrictions, or other taste-heavy rules at this stage. Those rules create churn without materially improving consistency for this project.

### Pros

- Matches the instructor's stated priorities directly
- Easy to explain and easy to enforce
- Keeps style changes mostly autofixable
- Avoids unnecessary churn from adopting a large third-party style guide
- Leaves room to tighten rules later if the team finds a real need

### Cons

- Less comprehensive than a well-known external guide
- Some formatting differences, such as quote style, will remain intentionally flexible
- If the codebase grows substantially, we may later want to revisit whether the rule set should be stricter

## Confirmation

Compliance is confirmed by `npm run lint`. When possible, contributors should use `npm run lint:fix` before pushing so formatting issues are normalized automatically.
