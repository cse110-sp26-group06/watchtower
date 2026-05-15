/* ── API ─────────────────────────────────────────────────────── */
export const API_BASE   = '/api/errors';
export const PROJECT_ID = 'demo';
export const PAGE_LIMIT = 20;

/* ── Mock data (remove when real API is ready) ───────────────── */
export const MOCK_ERRORS = [
  { id: '1', severity: 'critical', deploy: 'v2.4.1', message: 'TypeError: Cannot read property...', occurrences: 847 },
  { id: '2', severity: 'high',     deploy: 'v2.4.1', message: 'Network request failed: timeout',    occurrences: 234 },
  { id: '3', severity: 'medium',   deploy: 'v2.4.0', message: 'React Hook useEffect has missing...', occurrences: 89  },
  { id: '4', severity: 'low',      deploy: 'v2.3.9', message: 'Console warning: deprecated API',    occurrences: 45  },
];
