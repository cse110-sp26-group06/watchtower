/**
 * @fileoverview Handles dashboard routes for reading performance events.
 */
import { jsonResponse } from '../index.js';
import { getPerformance } from '../storage/d1.js';
import { validateApiKey } from '../middleware/auth.js';

/**
 * Returns paginated performance events for a project.
 *
 * @param {Request} request - Incoming dashboard request.
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @returns {Promise<Response>} JSON response containing performance data or an error message.
 */
export async function handleGetPerformance(request, env) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');

  const project = await validateApiKey(env, api_key);
  if (!project) {
    return jsonResponse({ status: 'error', message: 'Invalid API key' }, 401);
  }

  const queryParams = {
    entry_type: url.searchParams.get('entry_type'),
    since:      url.searchParams.get('since'),
    page:       parseInt(url.searchParams.get('page')  ?? '1'),
    limit:      parseInt(url.searchParams.get('limit') ?? '20'),
  };

  try {
    const events = await getPerformance(env, api_key, queryParams);
    return jsonResponse({ status: 'ok', performance: events }, 200);
  } catch (err) {
    console.error('Failed to fetch performance:', err);
    return jsonResponse({ status: 'error', message: 'Failed to fetch performance' }, 500);
  }
}
