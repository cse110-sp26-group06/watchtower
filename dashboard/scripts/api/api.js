// api.js
// DASH-3: Centralized API client for WatchTower dashboard read endpoints.
// Handles auth (api_key query param), network failures, 4xx, and 5xx error states.
// All other modules must go through apiGet() — never call fetch() directly.
//
// Auth note: X-Api-Key header is NOT used — backend CORS only allows
// Content-Type as a custom header. Auth is injected as api_key query param.

import { API_BASE, API_KEY, API_KEY_ERROR } from '../utils/constants.js';
import { getCurrentProject } from '../utils/projects.js';

const INGEST_BASE = 'https://watchtower-backend.group6.workers.dev/ingest';
const PERF_API_BASE = 'https://watchtower-backend.group6.workers.dev/api/performance';
const LOGS_API_BASE = 'https://watchtower-backend.group6.workers.dev/api/logs';

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Retrieves the WatchTower API key from constants.
 * Swap for runtime injection (meta tag, config object) when multi-project
 * support is needed.
 * @returns {string | null}
 */
function getApiKey() {
  try {
    const currentProject = getCurrentProject();
    if (currentProject?.apiKey) {return currentProject.apiKey;}

    if (API_KEY) { return API_KEY; }

    const projects = JSON.parse(window.localStorage.getItem('watchtower:projects') ?? '[]');
    const project = Array.isArray(projects) ? projects.find(item => item?.apiKey) : null;
    return project?.apiKey ?? window.localStorage.getItem('watchtower:api_key') ?? null;
  } catch {
    return window.localStorage.getItem('watchtower:api_key') ?? null;
  }
}

function getApiKeyError() {
  return API_KEY_ERROR ?? 'Missing WatchTower API key.';
}

/**
 * Builds a backend API URL, injecting api_key when available.
 * @param {string} endpoint
 * @param {Record<string, string>} [params]
 * @returns {string}
 */
function buildApiUrl(endpoint = '', params = {}) {
  const apiKey = getApiKey();
  const query = new URLSearchParams({
    ...(apiKey ? { api_key: apiKey } : {}),
    ...params,
  }).toString();

  return query
    ? `${API_BASE}${endpoint}?${query}`
    : `${API_BASE}${endpoint}`;
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

/**
 * Central fetch wrapper. Normalizes all error states into a consistent shape.
 *
 * Returns one of two shapes — callers must always check `success`:
 *   { success: true,  data:  any      }
 *   { success: false, error: ApiError }
 *
 * @typedef {"network"|"client"|"server"} ErrorType
 * @typedef {{ type: ErrorType, status?: number, message: string }} ApiError
 *
 * @param {string}      url
 * @param {RequestInit} [options]
 * @returns {Promise<{ success: boolean, data?: any, error?: ApiError }>}
 */
async function apiFetch(url, options = {}) {
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // ── 4xx Client Errors ──────────────────────────────────────────────────
    if (response.status >= 400 && response.status < 500) {
      const body = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          success: false,
          error: {
            type: "client",
            status: 401,
            message: "Unauthorized. Check your WatchTower API key.",
          },
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: {
            type: "client",
            status: 403,
            message: "Forbidden. You do not have access to this resource.",
          },
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: {
            type: "client",
            status: 404,
            message: "Resource not found.",
          },
        };
      }

      return {
        success: false,
        error: {
          type: "client",
          status: response.status,
          message: body?.message ?? `Client error (${response.status}).`,
        },
      };
    }

    // ── 5xx Server Errors ──────────────────────────────────────────────────
    if (response.status >= 500) {
      return {
        success: false,
        error: {
          type: "server",
          status: response.status,
          message: "A server error occurred. Please try again later.",
        },
      };
    }

    const data = await response.json();
    return { success: true, data };

  } catch {
    // ── Network Failure (offline, DNS failure, CORS, etc.) ─────────────────
    return {
      success: false,
      error: {
        type: "network",
        message: "Network error. Check your connection and try again.",
      },
    };
  }
}

// ─── Public Interface ─────────────────────────────────────────────────────────

/**
 * Make an authenticated PATCH request to the backend.
 * @param {string} endpoint
 * @param {object} body
 * @returns {Promise<{success: true, data: any} | {success: false, error: object}>}
 */
export async function apiPatch(endpoint, body = {}) {
  if (!getApiKey() && endpoint === '') {
    return {
      success: false,
      error: {
        type: 'client',
        status: 400,
        message: getApiKeyError(),
      },
    };
  }

  return apiFetch(buildApiUrl(endpoint), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Perform a GET request to a WatchTower read endpoint.
 * api_key is automatically injected as a query param on every request.
 * Additional params are merged alongside it.
 *
 * @param {string}                  [endpoint] - Path appended to API_BASE (e.g. '' or '/stats')
 * @param {Record<string, string>}  [params]   - Additional query parameters
 * @returns {Promise<{ success: boolean, data?: any, error?: ApiError }>}
 */
async function apiGet(endpoint = '', params = {}) {
  if (!getApiKey() && endpoint === '') {
    return {
      success: false,
      error: {
        type: 'client',
        status: 400,
        message: getApiKeyError(),
      },
    };
  }

  return apiFetch(buildApiUrl(endpoint, params), { method: "GET" });
}

/**
 * Fetches performance metrics from the WatchTower backend.
 *
 * This call retrieves performance data for the currently selected project.
 * The current project API key is appended as a query parameter, matching
 * the backend's API key validation requirements.
 *
 * @returns {Promise<{ success: boolean, data?: any, error?: { type: string, status?: number, message: string } }>}
 */
export async function apiGetPerformance() {
  const apiKey = getApiKey();
  const query = apiKey ? `?api_key=${encodeURIComponent(apiKey)}` : '';
  return apiFetch(`${PERF_API_BASE}${query}`, { method: 'GET' });
}

/**
 * Fetches log entries from GET /api/logs.
 *
 * Supports the following optional query params (pass via `params`):
 *   level  – filter by level ('info' | 'warn' | 'error')
 *   since  – ISO 8601 lower bound on server_timestamp
 *   page   – page number (default: 1)
 *   limit  – results per page (default: 20, max: 100)
 *
 * api_key is automatically injected by buildApiUrl().
 *
 * @param {Record<string, string>} [params] - Additional query parameters
 * @returns {Promise<{ success: boolean, data?: { status: string, logs: object[] }, error?: ApiError }>}
 */
export async function apiGetLogs(params = {}) {
  const apiKey = getApiKey();
  const query = new URLSearchParams({
    ...(apiKey ? { api_key: apiKey } : {}),
    ...params,
  }).toString();
  const queryString = query ? `?${query}` : '';
  return apiFetch(`${LOGS_API_BASE}${queryString}`, { method: 'GET' });
}

/**
 * POST performance events to the ingest endpoint.
 * Auth is passed as api_key inside the request body (not as a query param),
 * alongside service, environment, and the events array.
 *
 * @param {string} service       - The service name (e.g. 'my-app')
 * @param {string} environment   - The environment (e.g. 'production')
 * @param {Array}  events        - Array of performance event objects
 * @returns {Promise<{success: boolean, data?: any, error?: object}>}
 */
export async function apiPostPerformance(service, environment, events) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: {
        type: 'client',
        status: 400,
        message: getApiKeyError(),
      },
    };
  }

  return apiFetch(`${INGEST_BASE}/performance`, {
    method: 'POST',
    body: JSON.stringify({
      api_key: apiKey,
      service,
      environment,
      events,
    }),
  });
}

export { apiGet };
