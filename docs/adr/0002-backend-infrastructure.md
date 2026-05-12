# Use Cloudflare D1 as the primary database

## Status

- [ ] Pending
- [ ] Rejected
- [x] Accepted

## Context and Problem Statement

We need a database for storing users, projects, and error events in our app.

## Decision Drivers

- Need structured queries
- Need relational data
- Need easy integration with Cloudflare Workers
- Need simple deployment

## Considered Options

- Cloudflare D1
- Cloudflare KV
- Supabase/Postgres
- Firebase

## Decision Outcome

Lead Candidate: Cloudflare D1.

D1 is better for relational app data because it supports SQL, tables, filtering, and relationships.

### Pros

- Easy SQL queries
- Good fit for project/error/user tables
- Works directly with Cloudflare Workers

### Cons

- More setup than KV
- Not as simple as key-value lookup
- May need schema migrations

Alternative: Cloudflare KV

Cloudflare KV offers fast key-based lookups and is useful for caching, configuration values, and other simple read-heavy data. 
