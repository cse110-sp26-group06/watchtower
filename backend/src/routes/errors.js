/**
 * routes/errors.js
 * Handles all read API requests for the Dashboard.
 * Dashboard calls these endpoints to display errors to the developer.
 *
 * Current endpoints:
 *   GET /api/errors — returns paginated list of errors for a project
 *
 * Future endpoints (Sprint 3+):
 *   GET /api/errors/:id — single error detail
 *   PATCH /api/errors/:id — mark error as resolved
 */

import { jsonResponse } from '../index.js';
import { getErrors, getErrorById, resolveError } from '../storage/d1.js';
import { validateApiKey } from '../middleware/auth.js';

/**
 * Handles GET /api/errors
 * Returns a paginated list of errors for a project identified by api_key.
 *
 * Query parameters:
 *   api_key  — required, identifies which project's errors to return
 *   since    — ISO timestamp, only return errors after this time
 *   severity — filter by severity (critical/high/medium/low/error)
 *   status   — filter by status (resolved/unresolved)
 *   page     — page number, defaults to 1
 *   limit    — results per page, defaults to 20
 *
 * Example:
 *   GET /api/errors?api_key=wt_abc123&status=unresolved&page=1
 *
 * @param {Request} request - incoming GET request from Dashboard
 * @param {object} env - Cloudflare Worker environment, contains D1 binding
 * @returns {Response} JSON response with errors array or error message
 */
export async function handleGetErrors(request, env) {
  const url = new URL(request.url);

  // get api_key from query params — Dashboard sends this to identify the project
  const api_key = url.searchParams.get('api_key');

  // validate api_key against projects table in D1
  const project = await validateApiKey(env, api_key);
  if (!project) {
    return jsonResponse({ status: 'error', message: 'Invalid API key' }, 401);
  }

  // build filter params from query string
  const queryParams = {
    since:    url.searchParams.get('since'),
    severity: url.searchParams.get('severity'),
    status:   url.searchParams.get('status'),
    page:     parseInt(url.searchParams.get('page')  ?? '1'),
    limit:    parseInt(url.searchParams.get('limit') ?? '20'),
  };

  try {
    // fetch errors from D1 using filter params
    const errors = await getErrors(env, api_key, queryParams);

    // return errors array — Dashboard's normalizeError() transforms each row
    return jsonResponse({ status: 'ok', errors }, 200);
  } catch (err) {
    console.error('Failed to fetch errors:', err);
    return jsonResponse({ status: 'error', message: 'Failed to fetch errors' }, 500);
  }
}

/**
 * Handles GET /api/errors/:id
 * Returns a single error by id for the Dashboard error detail page
 * @param {Request} request - incoming GET request
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} id - error id from URL
 * @returns {Response} JSON response with single error or error message
 */
export async function handleGetErrorById(request, env, id) {
  try {
    // look up the error by id in D1
    const error = await getErrorById(env, id);

    // return 404 if not found
    if (!error) {
      return jsonResponse({ status: 'error', message: 'Error not found' }, 404);
    }

    return jsonResponse({ status: 'ok', error }, 200);
  } catch (err) {
    console.error('Failed to fetch error by id:', err);
    return jsonResponse({ status: 'error', message: 'Failed to fetch error' }, 500);
  }
}

/**
 * Handles PATCH /api/errors/:id
 * Marks a single error as resolved in D1
 * Called when developer clicks "Mark Resolved" on Dashboard
 *
 * @param {Request} request - incoming PATCH request
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} id - error id from URL
 * @returns {Response} JSON response confirming update or error message
 */
export async function handleResolveError(request, env, id) {
  try {
    // update status to resolved in D1
    const updated = await resolveError(env, id);

    if (!updated) {
      return jsonResponse({ status: 'error', message: 'Error not found' }, 404);
    }

    return jsonResponse({ status: 'ok', message: 'Error marked as resolved' }, 200);
  } catch (err) {
    console.error('Failed to resolve error:', err);
    return jsonResponse({ status: 'error', message: 'Failed to resolve error' }, 500);
  }
}