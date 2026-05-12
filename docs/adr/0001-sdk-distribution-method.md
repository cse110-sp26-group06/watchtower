# Pick SDK Distribution Method

## Status

- [ ] Pending
- [ ] Rejected
- [x] Accepted

## Context and Problem Statement
We need a way to package our software development kit (SDK) and a way to easily inject it into our user's project

## Decision Drivers

- Ease of installation for the user 
- Reliability during program updates
  - Structured releases, or just injecting our main branch into their program?

## Considered Options
- NPM Registry
- Content Delivery Network (CDN) - can add a script into their program 
- Direct Script Injection (Snippets) - provide a smaller 'loader' snippet that the user pastes into ther site's ```<head>```. This snippet will asynchronously fetch the full SDK bundle from a server
  
## Decision Outcome 
Development Process (internal within team): `npm install github:cse110-sp26-group06/watchtower` 

Finished Product (after it is published via npm):  `npm install watchtower-sdk` 

### Pros
- During the development process, using npm will provide us with access to the entire repo to do holistic E2E testing with the most up to date version of our software package
- Once product is ready to ship, we will publish it following a structured release system to prevent any errors with the repo from causing faults in the existing program - full testing will have to be done on each release before it can be sent out to customers


### Cons
- Requires a little more setup than direct script injection but allows for a fuller, more customizable system.
- Users may stay on old versions.

