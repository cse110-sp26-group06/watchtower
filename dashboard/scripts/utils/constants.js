/* ── API ─────────────────────────────────────────────────────── */
export const API_BASE   = '/api/errors';
export const PROJECT_ID = 'demo';
export const PAGE_LIMIT = 20;

/**
 * Normalizes a raw D1 error row into the shape the UI expects.
 * Call this on every record coming from the real API.
 *
 * D1 columns  → UI fields
 * ----------    ---------
 * stack_trace_json (JSON string) → stackTrace (string[])
 * payload_json     (JSON string) → deployment, timeline, occurrences, affectedUsers
 * client_timestamp              → firstSeen  (kept as ISO string; format in the card)
 * server_timestamp              → lastSeen   (kept as ISO string; format in the card)
 * error_type                    → errorType
 * (status comes through as-is from D1)
 *
 * @param {object} row  Raw row from D1 / API response
 * @returns {object}    Normalized error object
 */
export function normalizeError(row) {
  let stackTrace = [];
  let payload    = {};

  try { stackTrace = JSON.parse(row.stack_trace_json ?? '[]'); } catch { /* keep [] */ }
  try { payload    = JSON.parse(row.payload_json     ?? '{}'); } catch { /* keep {} */ }

  return {
    // Core identity
    id:            row.id,
    service:       row.service,
    environment:   row.environment,
    errorType:     row.error_type  ?? null,
    severity:      row.severity    ?? 'error',
    status:        row.status      ?? 'unresolved',
    message:       row.message,

    // Timestamps (ISO strings from D1 — format these in the card layer)
    firstSeen:     row.client_timestamp,
    lastSeen:      row.server_timestamp,

    // Stack trace
    stackTrace,

    // Everything else lives in payload_json; provide safe defaults
    deploy:        payload.deploy         ?? null,
    occurrences:   payload.occurrences    ?? 0,
    affectedUsers: payload.affectedUsers  ?? 0,
    deployment:    payload.deployment     ?? null,
    timeline:      Array.isArray(payload.timeline) ? payload.timeline : [],
  };
}

/* ── Mock data ───────────────────────────────────────────────────
 * Shaped to match the real D1 schema so normalizeError() works on
 * both mock and live data without branching.
 * Remove the MOCK_ERRORS export (or set it to []) when the real
 * API is wired up.
 * ─────────────────────────────────────────────────────────────── */
export const MOCK_ERRORS = [
  {
    id:               '1',
    api_key:          'demo-key',
    service:          'api-gateway',
    environment:      'production',
    message:          "TypeError: Cannot read property 'user' of undefined",
    error_type:       'TypeError',
    severity:         'critical',
    status:           'unresolved',
    client_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    server_timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    stack_trace_json: JSON.stringify([
      'at getUserProfile (app.js:145:12)',
      'at handleRequest (server.js:89:5)',
      'at Router.handle (express.js:234:3)',
      '[... more stack frames ...]',
    ]),
    payload_json: JSON.stringify({
      deploy:        'v2.4.1',
      occurrences:   847,
      affectedUsers: 234,
      deployment: {
        version:    'v2.4.1',
        deployedAt: '2 hours ago by john@startup.com',
        commit:     '#a3f892b',
      },
      timeline: [
        { label: 'Error spike detected',     time: '2 hours ago', type: 'critical' },
        { label: 'Alert sent to on-call',     time: '2 hours ago', type: 'info'     },
        { label: 'Deployment v2.4.1 started', time: '2 hours ago', type: 'deploy'   },
        { label: 'First occurrence recorded', time: '2 hours ago', type: 'info'     },
      ],
    }),
  },
  {
    id:               '2',
    api_key:          'demo-key',
    service:          'api-gateway',
    environment:      'production',
    message:          'Network request failed: timeout after 30000ms',
    error_type:       'NetworkError',
    severity:         'high',
    status:           'unresolved',
    client_timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    server_timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    stack_trace_json: JSON.stringify([
      'at XMLHttpRequest.onTimeout (xhr.js:214:8)',
      'at dispatchXhrRequest (axios.js:178:12)',
      'at Axios.request (axios.js:225:10)',
      'at fetchUserData (api.js:67:3)',
    ]),
    payload_json: JSON.stringify({
      deploy:        'v2.4.1',
      occurrences:   234,
      affectedUsers: 89,
      deployment: {
        version:    'v2.4.1',
        deployedAt: '5 hours ago by sarah@startup.com',
        commit:     '#d91c3f4',
      },
      timeline: [
        { label: 'Error spike detected',     time: '5 hours ago', type: 'critical' },
        { label: 'Alert sent to on-call',     time: '5 hours ago', type: 'info'     },
        { label: 'First occurrence recorded', time: '5 hours ago', type: 'info'     },
      ],
    }),
  },
  {
    id:               '3',
    api_key:          'demo-key',
    service:          'web-app',
    environment:      'production',
    message:          "React Hook useEffect has a missing dependency: 'userId'",
    error_type:       'Warning',
    severity:         'medium',
    status:           'unresolved',
    client_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    server_timestamp: new Date(Date.now() - 3  * 60 * 60 * 1000).toISOString(),
    stack_trace_json: JSON.stringify([
      'at checkDepsAreArrayDeps (react-dom.development.js:16302:5)',
      'at Object.useEffect (react-dom.development.js:16366:7)',
      'at ProfilePage (ProfilePage.jsx:44:3)',
    ]),
    payload_json: JSON.stringify({
      deploy:        'v2.4.0',
      occurrences:   89,
      affectedUsers: 0,
      deployment: {
        version:    'v2.4.0',
        deployedAt: '1 day ago by dev@startup.com',
        commit:     '#b72e1d9',
      },
      timeline: [
        { label: 'Warning first logged',      time: '1 day ago', type: 'info'   },
        { label: 'Deployment v2.4.0 started', time: '1 day ago', type: 'deploy' },
      ],
    }),
  },
  {
    id:               '4',
    api_key:          'demo-key',
    service:          'web-app',
    environment:      'staging',
    message:          'Console warning: deprecated API usage — componentWillMount',
    error_type:       'DeprecationWarning',
    severity:         'low',
    status:           'resolved',
    client_timestamp: new Date(Date.now() - 3  * 24 * 60 * 60 * 1000).toISOString(),
    server_timestamp: new Date(Date.now() - 1  * 24 * 60 * 60 * 1000).toISOString(),
    stack_trace_json: JSON.stringify([
      'at LegacyComponent.componentWillMount (LegacyComponent.jsx:12:5)',
      'at ReactDOM.render (react-dom.development.js:20558:3)',
    ]),
    payload_json: JSON.stringify({
      deploy:        'v2.3.9',
      occurrences:   45,
      affectedUsers: 0,
      deployment: {
        version:    'v2.3.9',
        deployedAt: '3 days ago by dev@startup.com',
        commit:     '#c44a7e2',
      },
      timeline: [
        { label: 'Deprecation warning logged', time: '3 days ago', type: 'info' },
      ],
    }),
  },
];