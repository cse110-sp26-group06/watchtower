---
# Configuration for the Jekyll template "Just the Docs"
parent: Decisions
nav_order: 100
title: ADR Template

# These are optional elements. Feel free to remove any of them.
# status: "{proposed | rejected | accepted | deprecated | … | superseded by ADR-0123"
# date: {YYYY-MM-DD when the decision was last updated}
# decision-makers: {list everyone involved in the decision}
# consulted: {list everyone whose opinions are sought (typically subject-matter experts); and with whom there is a two-way communication}
# informed: {list everyone who is kept up-to-date on progress; and with whom there is a one-way communication}
---
<!-- we need to disable MD025, because we use the different heading "ADR Template" in the homepage (see above) than it is foreseen in the template -->
<!-- markdownlint-disable-next-line MD025 -->
# Adding Linting Through GitHub Actions

## Context and Problem Statement

The codebase currently has no CI to perform quality assurance for code. We need some way to make sure that changes will not cause any new bugs and follow style/naming guidelines.

<!-- This is an optional element. Feel free to remove. -->
## Decision Drivers

* Concern over quality of code pushed
* Warn team members in case errors weren't caught in developement

## Considered Options

* ESLint


## Decision Outcome

Chosen option: ESLint, because it is the main and only option for Javascript linting. It is also open source and free, so we can stay up to date and modify the linter as is required for this product.



### Confirmation

{Describe how the implementation of/compliance with the ADR can/will be confirmed. Is the chosen design and its implementation in line with the decision? E.g., a design/code review or a test with a library such as ArchUnit can help validate this. Note that although we classify this element as optional, it is included in many ADRs.}

ESLint will be part of the main branch and pulled to every developement environment for individual features. Whenever a push or pull request is made it will run and perform checks according to the needs presented by the team. ESLint will only check .js files and allow merges on error, so overriding failed checks to push code is available if needed.

*Note:* Per code review, it was recommended to also lint .html and .css files. As such, this was added to the linter. Linting for these files is kept intentionally minimal to avoid needing a huge mechanical overwrite, as this was a late addition to the project.

## More Information

This section will be updated with the current linting rules that will be checked on every pull and push request. Any modifications to the timing or placement of the linter will be appended to this ADR.

### JavaScript (`.js` files)

1. No unused variables
2. Console log is allowed
3. Semicolons at the end of every non control flow statement
4. Require indent of 2 spaces
5. Enforce strict equality (except null)
6. Control statements wrapped in curly braces
7. Indentation for code inside control statements
8. New code blocks have to space out the braces from the function signature
9. Keywords have at least one space before and after

### HTML (`.html` files)

1. No duplicate class attributes on an element
2. No empty CSS blocks inside `<style>` tags
3. Maximum element nesting depth of 10

### CSS (`.css` files)

1. No duplicate `@import` statements

