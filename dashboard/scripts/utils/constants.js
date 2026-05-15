/* ── API ─────────────────────────────────────────────────────── */
export const API_BASE   = '/api/errors';
export const PROJECT_ID = 'demo';
export const PAGE_LIMIT = 20;

/* ── Mock data (remove when real API is ready) ───────────────── */
export const MOCK_ERRORS = [
  {
    id: '1',
    severity: 'critical',
    deploy: 'v2.4.1',
    message: "TypeError: Cannot read property 'user' of undefined",
    occurrences: 847,
    affectedUsers: 234,
    firstSeen: '2 hours ago',
    lastSeen: '4 minutes ago',
    deployment: {
      version: 'v2.4.1',
      deployedAt: '2 hours ago by john@startup.com',
      commit: '#a3f892b',
    },
    stackTrace: [
      'at getUserProfile (app.js:145:12)',
      'at handleRequest (server.js:89:5)',
      'at Router.handle (express.js:234:3)',
      '[... more stack frames ...]',
    ],
    timeline: [
      { label: 'Error spike detected',     time: '2 hours ago',  type: 'critical' },
      { label: 'Alert sent to on-call',     time: '2 hours ago',  type: 'info'     },
      { label: 'Deployment v2.4.1 started', time: '2 hours ago',  type: 'deploy'   },
      { label: 'First occurrence recorded', time: '2 hours ago',  type: 'info'     },
    ],
  },
  {
    id: '2',
    severity: 'high',
    deploy: 'v2.4.1',
    message: 'Network request failed: timeout after 30000ms',
    occurrences: 234,
    affectedUsers: 89,
    firstSeen: '5 hours ago',
    lastSeen: '12 minutes ago',
    deployment: {
      version: 'v2.4.1',
      deployedAt: '5 hours ago by sarah@startup.com',
      commit: '#d91c3f4',
    },
    stackTrace: [
      'at XMLHttpRequest.onTimeout (xhr.js:214:8)',
      'at dispatchXhrRequest (axios.js:178:12)',
      'at Axios.request (axios.js:225:10)',
      'at fetchUserData (api.js:67:3)',
    ],
    timeline: [
      { label: 'Error spike detected',     time: '5 hours ago',  type: 'critical' },
      { label: 'Alert sent to on-call',     time: '5 hours ago',  type: 'info'     },
      { label: 'First occurrence recorded', time: '5 hours ago',  type: 'info'     },
    ],
  },
  {
    id: '3',
    severity: 'medium',
    deploy: 'v2.4.0',
    message: "React Hook useEffect has a missing dependency: 'userId'",
    occurrences: 89,
    affectedUsers: 0,
    firstSeen: '1 day ago',
    lastSeen: '3 hours ago',
    deployment: {
      version: 'v2.4.0',
      deployedAt: '1 day ago by dev@startup.com',
      commit: '#b72e1d9',
    },
    stackTrace: [
      'at checkDepsAreArrayDeps (react-dom.development.js:16302:5)',
      'at Object.useEffect (react-dom.development.js:16366:7)',
      'at ProfilePage (ProfilePage.jsx:44:3)',
    ],
    timeline: [
      { label: 'Warning first logged',      time: '1 day ago',   type: 'info'   },
      { label: 'Deployment v2.4.0 started', time: '1 day ago',   type: 'deploy' },
    ],
  },
  {
    id: '4',
    severity: 'low',
    deploy: 'v2.3.9',
    message: 'Console warning: deprecated API usage — componentWillMount',
    occurrences: 45,
    affectedUsers: 0,
    firstSeen: '3 days ago',
    lastSeen: '1 day ago',
    deployment: {
      version: 'v2.3.9',
      deployedAt: '3 days ago by dev@startup.com',
      commit: '#c44a7e2',
    },
    stackTrace: [
      'at LegacyComponent.componentWillMount (LegacyComponent.jsx:12:5)',
      'at ReactDOM.render (react-dom.development.js:20558:3)',
    ],
    timeline: [
      { label: 'Deprecation warning logged', time: '3 days ago', type: 'info' },
    ],
  },
];
