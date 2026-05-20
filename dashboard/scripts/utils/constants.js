/* ── API ─────────────────────────────────────────────────────── */
export const API_BASE   = 'https://watchtower-backend.group6.workers.dev/api/errors';
export const API_KEY    = 'wt_e5432da49ac342e6979f901324dae034';
export const PAGE_LIMIT = 20;

/**
 * Normalizes a raw D1 error row into the shape the UI expects.
 * Call this on every record coming from the real API.
 *
 * Real D1 column shapes (confirmed from live API response):
 *   stack_trace  → plain string (e.g. "TypeError at app.js:42"), NOT a JSON array
 *   payload_json → JSON string containing message, type, stack_trace, file, lineno, colno
 *   file         → top-level string column
 *   lineno       → top-level number column
 *   colno        → top-level number column
 *
 * D1 columns  → UI fields
 * ----------    ---------
 * stack_trace  (plain string) → stackTrace
 * payload_json (JSON string)  → payload (parsed object)
 * client_timestamp            → firstSeen  (ISO string; format in the card)
 * server_timestamp            → lastSeen   (ISO string; format in the card)
 * error_type                  → errorType
 * status                      → status (comes through as-is from D1)
 *
 * @param {object} row  Raw row from D1 / API response
 * @returns {object}    Normalized error object
 */
export function normalizeError(row) {
  let payload = {};

  try { payload = JSON.parse(row.payload_json ?? '{}'); } catch { /* keep {} */ }

  return {
    // Core identity
    id:          row.id,
    service:     row.service,
    environment: row.environment,
    errorType:   row.error_type  ?? null,
    severity:    row.severity    ?? 'error',
    status:      row.status      ?? 'unresolved',
    message:     row.message,

    // File location (top-level D1 columns)
    file:   row.file   ?? null,
    lineno: row.lineno ?? null,
    colno:  row.colno  ?? null,

    // Stack trace — plain string from D1, not a JSON array
    stackTrace: row.stack_trace ?? '',

    // Timestamps (ISO strings from D1 — format in the card layer)
    firstSeen: row.client_timestamp,
    lastSeen:  row.server_timestamp,

    // payload_json fields — safe defaults for fields not yet sent by SDK
    deploy:        payload.deploy         ?? null,
    occurrences:   payload.occurrences    ?? 0,
    affectedUsers: payload.affectedUsers  ?? 0,
    deployment:    payload.deployment     ?? null,
    timeline:      Array.isArray(payload.timeline) ? payload.timeline : [],
  };
}

/* ── Mock data ────────────────────────────────────────────────────
 * Shaped to match the real D1 schema so normalizeError() works on
 * both mock and live data without branching.
 * Set MOCK_ERRORS to [] to disable and use the real API.
 * ─────────────────────────────────────────────────────────────── */
export const MOCK_ERRORS = [];