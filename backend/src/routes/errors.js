/* global console */
//pull
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
import { getErrors } from '../storage/d1.js';
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