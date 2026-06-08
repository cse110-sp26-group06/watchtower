/**
 * @fileoverview Handles dashboard routes for reading and resolving error events.
 */

import { jsonResponse } from '../index.js';
import { getErrors, getErrorById, resolveError } from '../storage/d1.js';
import { validateApiKey } from '../middleware/auth.js';

/**
 * Returns a paginated list of errors for the project identified by `api_key`.
 *
 * @param {Request} request - Incoming dashboard request.
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @returns {Promise<Response>} JSON response containing the error list or an error message.
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
 * Returns a single error for the dashboard error detail page.
 *
 * @param {Request} request - Incoming GET request.
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} id - Error identifier from the URL.
 * @returns {Promise<Response>} JSON response containing the error or an error message.
 */
export async function handleGetErrorById(request, env, id) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');

  const project = await validateApiKey(env, api_key);
  if (!project) {
    return jsonResponse({ status: 'error', message: 'Invalid API key' }, 401);
  }

  try {
    const error = await getErrorById(env, id, api_key);

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
 * Marks a single error as resolved.
 *
 * @param {Request} request - Incoming PATCH request.
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} id - Error identifier from the URL.
 * @returns {Promise<Response>} JSON response confirming the update or describing the failure.
 */
export async function handleResolveError(request, env, id) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');

  const project = await validateApiKey(env, api_key);
  if (!project) {
    return jsonResponse({ status: 'error', message: 'Invalid API key' }, 401);
  }

  try {
    const updated = await resolveError(env, id, api_key);

    if (!updated) {
      return jsonResponse({ status: 'error', message: 'Error not found' }, 404);
    }

    return jsonResponse({ status: 'ok', message: 'Error marked as resolved' }, 200);
  } catch (err) {
    console.error('Failed to resolve error:', err);
    return jsonResponse({ status: 'error', message: 'Failed to resolve error' }, 500);
  }
}
