const STORAGE_KEY = 'watchtower:session';
const NEXT_QUERY_PARAM = 'next';

export const DASHBOARD_HOME = 'error-list.html';

const ALLOWED_TARGETS = new Set([
  DASHBOARD_HOME,
  'error-detail.html',
  'performance.html',
  'feedback.html',
  'alerts.html',
  'settings.html',
]);

/**
 * Returns true when the email matches a conventional address shape.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates login form input and returns field-specific messages.
 * @param {string} email
 * @param {string} password
 * @returns {{ email: string, password: string }}
 */
export function validateCredentials(email, password) {
  return {
    email: isValidEmail(email) ? '' : 'Enter a valid email address.',
    password: password.length >= 8 ? '' : 'Password must be at least 8 characters long.',
  };
}

/**
 * Returns the persisted session or null when absent/invalid.
 * @returns {{ email: string } | null}
 */
export function getSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || typeof session.email !== 'string' || !isValidEmail(session.email)) {
      return null;
    }

    return { email: session.email };
  } catch {
    return null;
  }
}

/**
 * Persists a login session.
 * @param {string} email
 * @returns {{ email: string }}
 */
export function createSession(email) {
  const session = { email: email.trim() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * Clears the persisted session and transient session-only dashboard state.
 * @returns {void}
 */
export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem('watchtower:resolved-error-ids');
}

/**
 * Returns a safe in-app redirect target from the current URL query string.
 * @returns {string}
 */
export function getRedirectTarget() {
  const rawTarget = new URLSearchParams(window.location.search).get(NEXT_QUERY_PARAM);
  if (!rawTarget) return DASHBOARD_HOME;

  try {
    const url = new URL(rawTarget, window.location.href);
    if (url.origin !== window.location.origin) return DASHBOARD_HOME;

    const file = url.pathname.split('/').pop();
    if (!ALLOWED_TARGETS.has(file)) return DASHBOARD_HOME;

    return `${file}${url.search}${url.hash}`;
  } catch {
    return DASHBOARD_HOME;
  }
}

/**
 * Redirects to the dashboard, using a validated next target when present.
 * @returns {void}
 */
export function redirectToDashboard() {
  window.location.replace(getRedirectTarget());
}

/**
 * Redirects unauthenticated users to the login landing page.
 * @returns {void}
 */
export function redirectToLogin() {
  const next = `${window.location.pathname.split('/').pop() ?? DASHBOARD_HOME}${window.location.search}${window.location.hash}`;
  window.location.replace(`index.html?${NEXT_QUERY_PARAM}=${encodeURIComponent(next)}`);
}

/**
 * Enforces an authenticated session on protected pages.
 * @returns {{ email: string } | null}
 */
export function requireAuth() {
  const session = getSession();
  if (!session) {
    redirectToLogin();
    return null;
  }

  return session;
}
