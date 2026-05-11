# Ingestion Contract

---

## Overview

Agreed contract between SDK and Backend. Don't change anything here without checking with both sides — if one team updates their implementation without updating this doc, the other team breaks.

SDK batches events and POSTs to one of three endpoints. Backend validates, stores in D1, and returns a status.

---

## Base URL

```
https://<worker>.watchtower.workers.dev
```

> TBD — lock this down before Sprint 2.

---

## Authentication

`api_key` goes in the JSON body — no separate auth header needed.

For now, keys are just hardcoded strings: `client1`, `client2`, `client3`, etc. Backend checks against that list. Wrong key or missing key → `401`. We'll swap this out for real provisioning later in the quarter.

All requests need `Content-Type: application/json`.

## Event IDs

SDK doesn't generate these. Backend assigns a unique `event_id` to each event when it arrives, before writing to D1.

## CORS

SDK runs in someone else's browser on someone else's domain, so the Worker needs to return CORS headers or the browser will block the request:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Also handle `OPTIONS` preflight — just return `204 No Content`.

---

## Endpoints

| Event Type  | Method | Endpoint           |
|-------------|--------|--------------------|
| Error       | POST   | `/ingest/error`    |
| Log         | POST   | `/ingest/log`      |
| Performance | POST   | `/ingest/performance`     |

---

## Request Format

All three endpoints use the same envelope:

| Field         | Type            | Required | Description                                      |
|---------------|-----------------|----------|--------------------------------------------------|
| `api_key`     | string          | Yes      | Which client is sending this                     |
| `service`     | string          | Yes      | Name of the customer's app                       |
| `environment` | string          | Yes      | `"production"`, `"staging"`, `"dev"`, etc.       |
| `events`      | array of objects| Yes      | One or more events — batching is fine and encouraged |

`events` can't be empty — `"events": []` returns `400`.

---

## Schemas

### Error — `POST /ingest/error`

```json
{
  "type": "object",
  "properties": {
    "api_key": { "type": "string" },
    "service": { "type": "string" },
    "environment": { "type": "string" },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "event_type": { "const": "error" },
          "timestamp": { "type": "string", "format": "date-time" },
          "payload": {
            "type": "object",
            "properties": {
              "message": { "type": "string" },
              "type": { "type": "string" },
              "stack_trace": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "file": { "type": "string" },
                    "line": { "type": "number" },
                    "column": { "type": "number" }
                  },
                  "required": ["file", "line", "column"]
                }
              },
              "lineno": { "type": "number" },
              "colno": { "type": "number" },
              "severity": { "type": "string" }
            },
            "required": ["message", "stack_trace"]
          }
        },
        "required": ["event_type", "timestamp", "payload"]
      }
    }
  },
  "required": ["api_key", "service", "environment", "events"]
}
```

**Notes:**
- `severity` is optional but Backend defaults to `"error"` if missing. SDK should populate it when possible — Dashboard will use it for filtering.
- `type` is the error class name, e.g. `"TypeError"`, `"ReferenceError"`.

---

### Log — `POST /ingest/log`

```json
{
  "type": "object",
  "properties": {
    "api_key": { "type": "string" },
    "service": { "type": "string" },
    "environment": { "type": "string" },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "event_type": { "const": "log" },
          "timestamp": { "type": "string", "format": "date-time" },
          "payload": {
            "type": "object",
            "properties": {
              "level": { "type": "string" },
              "message": { "type": "string" },
              "timestamp": { "type": "string", "format": "date-time" }
            },
            "required": ["level", "message", "timestamp"]
          }
        },
        "required": ["event_type", "timestamp", "payload"]
      }
    }
  },
  "required": ["api_key", "service", "environment", "events"]
}
```

**Notes:**
- `level` should be one of: `"debug"`, `"info"`, `"warn"`, `"error"`.
- These are user interaction events — button clicks, navigation, form submissions — not general app logs.
- The idea is to use logs around an error to figure out what the user was doing when things went wrong.

---

### Performance — `POST /ingest/performance`

```json
{
  "type": "object",
  "properties": {
    "api_key": { "type": "string" },
    "service": { "type": "string" },
    "environment": { "type": "string" },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "event_type": { "const": "performance" },
          "timestamp": { "type": "string", "format": "date-time" },
          "payload": {
            "type": "object",
            "properties": {
              "span_id": { "type": "string" },
              "trace_id": { "type": "string" },
              "name": { "type": "string" },
              "start_timestamp": { "type": "string", "format": "date-time" },
              "end_timestamp": { "type": "string", "format": "date-time" },
              "duration_ms": { "type": "number" }
            },
            "required": ["name", "start_timestamp", "end_timestamp", "duration_ms"]
          }
        },
        "required": ["event_type", "timestamp", "payload"]
      }
    }
  },
  "required": ["api_key", "service", "environment", "events"]
}
```

**Notes:**
- Sent to track how long operations take — API calls, page loads, anything slow.
- `duration_ms` is what the Dashboard cares about most.
- `span_id` and `trace_id` are optional for now, useful later if we add tracing.

---

## Responses

| Status | Meaning |
|--------|---------|
| `200 OK` | All good, events stored |
| `400 Bad Request` | Bad JSON or missing required fields |
| `401 Unauthorized` | Bad or missing `api_key` |
| `500 Internal Server Error` | Something broke on our end |

Success:

```json
{ "status": "ok" }
```

Error:

```json
{ "status": "error", "message": "<what went wrong>" }
```

---

## Open Questions

Still need answers on these before Sprint 2:

| # | Question | Owner |
|---|----------|-------|
| 1 | `/ingest/span` or `/ingest/performance`? | Both teams | Resolved — using `/ingest/performance` |
| 2 | Long-term key provisioning — Dashboard UI or auto-generated? | Dashboard + Backend |
| 3 | Do we need a session/user ID to correlate logs with errors? | SDK team |
| 4 | Does SDK always send `severity`, or does Backend need to default it? | SDK team |

---

## Example Payload

Batched error POST:

```json
{
  "api_key": "client1",
  "service": "my-app",
  "environment": "production",
  "events": [
    {
      "event_type": "error",
      "timestamp": "2026-05-10T18:00:00Z",
      "payload": {
        "message": "Cannot read properties of undefined (reading 'map')",
        "type": "TypeError",
        "severity": "error",
        "stack_trace": [
          { "file": "app.js", "line": 42, "column": 15 },
          { "file": "app.js", "line": 10, "column": 3 }
        ]
      }
    }
  ]
}
```

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial draft based on SDK sync | Kevin Chung |
| 2026-05-10 | Auth clarified, CORS added, event ID ownership, empty events behavior | Kevin Chung |
