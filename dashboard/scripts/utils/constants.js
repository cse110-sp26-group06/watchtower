/* ── API ─────────────────────────────────────────────────────── */
// API_KEY is loaded from env.js when present. Will have it fall back to null if no key found
let WATCHTOWER_API_KEY = null;
let API_KEY_CONFIG_ERROR = null;

try {
  // Use a stable query string so browsers don't reuse an old cached 404
  // from before env.js existed locally.
  ({ WATCHTOWER_API_KEY } = await import('./env.js?watchtower-local-config'));
} catch (error) {
  try {
    // Some local static servers behave differently with module URLs that
    // include a query string, so fall back to the plain path.
    ({ WATCHTOWER_API_KEY } = await import('./env.js'));
  } catch (fallbackError) {
    API_KEY_CONFIG_ERROR = 'No WatchTower API key is available. Create dashboard/scripts/utils/env.js from env.example.js with WATCHTOWER_API_KEY, or generate/select a project from onboarding.';
    console.error('[WatchTower] Failed to load dashboard API key config:', error);
    console.error('[WatchTower] Fallback import without query string also failed:', fallbackError);
  }
}

if (typeof WATCHTOWER_API_KEY === 'string') {
  WATCHTOWER_API_KEY = WATCHTOWER_API_KEY.trim();
}

if (!WATCHTOWER_API_KEY) {
  WATCHTOWER_API_KEY = null;
  API_KEY_CONFIG_ERROR ??= 'No WatchTower API key is available. Set WATCHTOWER_API_KEY in dashboard/scripts/utils/env.js, or generate/select a project from onboarding.';
}

export const API_BASE   = 'https://watchtower-backend.group6.workers.dev/api/errors';
export const API_KEY    = WATCHTOWER_API_KEY;
export const API_KEY_ERROR = API_KEY_CONFIG_ERROR;
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

/* Temporarily disabled mock errors.
const DISABLED_MOCK_ERRORS = [
  {
    id: 'err_1',
    service: 'checkout-web',
    environment: 'production',
    error_type: 'TypeError',
    severity: 'critical',
    status: 'unresolved',
    message: "Cannot read properties of undefined (reading 'user')",
    file: 'src/pages/Checkout.jsx',
    lineno: 128,
    colno: 17,
    stack_trace: [
      "TypeError: Cannot read properties of undefined (reading 'user')",
      '    at renderCheckout (src/pages/Checkout.jsx:128:17)',
      '    at CheckoutPage (src/pages/Checkout.jsx:84:9)',
      '    at RouterView (src/router.js:42:5)',
    ].join('\n'),
    client_timestamp: '2026-05-26T15:31:00.000Z',
    server_timestamp: '2026-05-26T15:31:03.000Z',
    payload_json: JSON.stringify({
      occurrences: 18,
      affectedUsers: 7,
      deployment: {
        version: 'web-2026.05.26.2',
        deployedAt: '2026-05-26T14:52:00.000Z',
        commit: '8f3c2a1',
      },
      timeline: [
        { type: 'deploy', label: 'Deployment completed', time: '2026-05-26T14:52:00.000Z' },
        { type: 'critical', label: 'Error first seen', time: '2026-05-26T15:31:00.000Z' },
        { type: 'critical', label: 'Error repeated 18 times', time: '2026-05-26T15:46:00.000Z' },
      ],
    }),
  },
  {
    id: 'err_2',
    service: 'billing-api',
    environment: 'staging',
    error_type: 'ReferenceError',
    severity: 'warning',
    status: 'unresolved',
    message: 'promoCodeValidator is not defined',
    file: 'src/billing/promotions.js',
    lineno: 64,
    colno: 11,
    stack_trace: [
      'ReferenceError: promoCodeValidator is not defined',
      '    at applyPromotion (src/billing/promotions.js:64:11)',
      '    at createInvoice (src/billing/invoices.js:212:19)',
    ].join('\n'),
    client_timestamp: '2026-05-26T12:08:00.000Z',
    server_timestamp: '2026-05-26T12:08:01.000Z',
    payload_json: JSON.stringify({
      occurrences: 5,
      affectedUsers: 2,
      timeline: [
        { type: 'info', label: 'Staging test started', time: '2026-05-26T12:02:00.000Z' },
        { type: 'critical', label: 'Error captured', time: '2026-05-26T12:08:00.000Z' },
      ],
    }),
  },
  {
    id: 'err_3',
    service: 'auth-worker',
    environment: 'production',
    error_type: 'Error',
    severity: 'info',
    status: 'resolved',
    message: 'Session refresh token expired',
    file: 'workers/auth/session.js',
    lineno: 39,
    colno: 5,
    stack_trace: [
      'Error: Session refresh token expired',
      '    at refreshSession (workers/auth/session.js:39:5)',
    ].join('\n'),
    client_timestamp: '2026-05-25T22:14:00.000Z',
    server_timestamp: '2026-05-25T22:14:02.000Z',
    payload_json: JSON.stringify({
      occurrences: 11,
      affectedUsers: 4,
      timeline: [
        { type: 'critical', label: 'Error captured', time: '2026-05-25T22:14:00.000Z' },
        { type: 'info', label: 'Marked resolved', time: '2026-05-25T23:03:00.000Z' },
      ],
    }),
  },
];
*/
