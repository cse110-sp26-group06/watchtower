/**
 * @fileoverview Handles dashboard routes for notification preferences.
 */

import { getNotificationSettings, upsertNotificationSettings } from '../storage/d1.js';
import { getUserById } from '../middleware/auth.js';

/**
 * Creates a JSON response with the CORS headers required by the dashboard.
 *
 * @param {unknown} body - Response body to serialize.
 * @param {number} [status=200] - HTTP status code.
 * @returns {Response} Serialized JSON response.
 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    },
  });
}

/**
 * Returns the notification settings for a user and project.
 *
 * @param {Request} request - Incoming dashboard request.
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @returns {Promise<Response>} JSON response containing the current notification settings.
 */
export async function handleGetNotificationSettings(request, env) {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');
  const project_id = url.searchParams.get('project_id');

  if (!user_id || !project_id) {
    return jsonResponse({ status: 'error', message: 'user_id and project_id required' }, 400);
  }

  const user = await getUserById(env, user_id);
  if (!user) {
    return jsonResponse({ status: 'error', message: 'Unknown user_id' }, 404);
  }

  try {
    const settings = await getNotificationSettings(env, user_id, project_id);
    return jsonResponse({
      status: 'ok',
      email_enabled: settings ? settings.email_enabled === 1 : false
    }, 200);
  } 
  catch (err) {
    console.error('Failed to get notification settings:', err);
    return jsonResponse({ status: 'error', message: 'Failed to get settings' }, 500);
  }
}

/**
 * Creates or updates notification settings for a user and project.
 *
 * @param {Request} request - Incoming dashboard request.
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @returns {Promise<Response>} JSON response confirming the stored notification settings.
 */
export async function handleUpdateNotificationSettings(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ status: 'error', message: 'Invalid JSON' }, 400);
  }

  const { user_id, project_id, email_enabled } = body;

  if (!user_id || !project_id) {
    return jsonResponse({ status: 'error', message: 'user_id and project_id required' }, 400);
  }
  if (typeof email_enabled !== 'boolean') {
    return jsonResponse({ status: 'error', message: 'email_enabled must be a boolean' }, 400);
  }

  const user = await getUserById(env, user_id);
  if (!user) {
    return jsonResponse({ status: 'error', message: 'Unknown user_id' }, 404);
  }

  try {
    await upsertNotificationSettings(env, user_id, project_id, email_enabled);
    return jsonResponse({ status: 'ok', email_enabled }, 200);
  } catch (err) {
    console.error('Failed to update notification settings:', err);
    return jsonResponse({ status: 'error', message: 'Failed to update settings' }, 500);
  }
}
