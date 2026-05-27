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
# Product form factor
## Context and Problem Statement

We need to define what our software is going to look like, what the end to end flow of an error should be between inital occurence and appearance on the dashboard

<!-- This is an optional element. Feel free to remove. -->
## Decision Drivers

* Having a defined form factor makes it easy to delegate and organize the app
* Each team can focus on one deliverable, final product can be assembled by simply connecting them

## Considered Options

* SDK might not be strictly needed (web app + backend only)
* Web App + SDK + Endpoints
* Web App lives directly on web server, no endpoints needed.


## Decision Outcome

Chosen option: Web App + SDK + REST Endpoints, because it provides users the flexibility to customize, and is reasonably simple enough to implement before the product is due..

<!-- This is an optional element. Feel free to remove. -->
## More Information

Our team is already split up into the appropriate teams to implement each feature. Each team will work with each other to define how an error passes through (such as from SDK to the endpoints or endpoints to dashboard), using agreed upon data formats/schema so that teams don't need to explicitly check the code of other teams.

