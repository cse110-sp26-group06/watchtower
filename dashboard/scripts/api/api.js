// api.js
// DASH-3: Centralized API client for WatchTower dashboard read endpoints.
// Handles auth (X-Api-Key), network failures, 4xx, and 5xx error states.
// All other api/* modules must go through apiGet() — never call fetch() directly.

import { API_BASE } from '../utils/constants.js';

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Retrieves the WatchTower API key.
 * Swap implementation to pull from a meta tag, config object, or env injection.
 * @returns {string | null}
 */
function getApiKey() {
  return window.__WATCHTOWER_API_KEY__ ?? null;
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

/**
 * Central fetch wrapper. Attaches auth headers and normalizes all error states.
 *
 * Returns one of two shapes — callers must always check `success`:
 *   { success: true,  data:  any       }
 *   { success: false, error: ApiError  }
 *
 * @typedef {"network"|"client"|"server"} ErrorType
 * @typedef {{ type: ErrorType, status?: number, message: string }} ApiError
 *
 * @param {string}      url
 * @param {RequestInit} [options]
 * @returns {Promise<{ success: boolean, data?: any, error?: ApiError }>}
 */
async function apiFetch(url, options = {}) {
  const apiKey = getApiKey();

  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey } : {}),
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
 * Perform a GET request to a WatchTower read endpoint.
 * Params are appended as a query string via URLSearchParams.
 *
 * @param {string}              endpoint - Path relative to API_BASE (e.g. "/errors")
 * @param {Record<string,string>} [params] - Query parameters
 * @returns {Promise<{ success: boolean, data?: any, error?: ApiError }>}
 */
async function apiGet(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query
    ? `${API_BASE}${endpoint}?${query}`
    : `${API_BASE}${endpoint}`;

  return apiFetch(url, { method: "GET" });
}

export { apiGet };