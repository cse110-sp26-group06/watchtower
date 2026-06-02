/* global console */
/**
 * routes/performance.js
 * Handles read API requests for performance data.
 *
 * Current endpoints:
 *   GET /api/performance — returns paginated performance events for a project
 */
import { jsonResponse } from '../index.js';
import { getPerformance } from '../storage/d1.js';
import { validateApiKey } from '../middleware/auth.js';

/**
 * Handles GET /api/performance
 * Returns performance events for a project
 *
 * Query parameters:
 *   api_key    — required
 *   entry_type — filter by resource/paint/navigation
 *   since      — ISO timestamp
 *   page       — defaults to 1
 *   limit      — defaults to 20
 *
 * @param {Request} request
 * @param {object} env
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