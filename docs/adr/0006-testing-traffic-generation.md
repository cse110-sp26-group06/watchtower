---
# Configuration for the Jekyll template "Just the Docs"
parent: Decisions
nav_order: 100
title: ADR Template

# status: "proposed"
# date: {2026-05-17 when the decision was last updated}
# decision-makers: {Zayn, Nicholas}
---
<!-- we need to disable MD025, because we use the different heading "ADR Template" in the homepage (see above) than it is foreseen in the template -->
<!-- markdownlint-disable-next-line MD025 -->
# Testing App and Traffic Generation

## Context and Problem Statement


We need to watchtower running in a real environment to test functionality and performance. Watchtower should be able to inject into websites from npm and work with minimal setup. 

## Decision Drivers

* Uncertainty in if the code works as intented
* Desire to see what metrics matter/which are most common.
* Get visibility into what errors are thrown and how those specific errors are processed

## Considered Options

* Vibe coding small app to test traffic on
* Use existing software from 110 (Warmup 2)
* Accept "offering" from professor (per issue #42)

## Decision Outcome

Use the website from warump 2, as it is already built and will require mininal setup to host/inject watchtower. Will have both team 6 members and real users generate traffic (hosted in a separate repository)


### Confirmation

Compliance will be confirmed once injected/set up a full dashboard for the test app, and documented in the wiki


