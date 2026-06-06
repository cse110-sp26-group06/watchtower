/* global console */
/**
 * routes/notifications.js
 * Handles notification preference endpoints for Dashboard.
 *
 * Current endpoints:
 *   GET  /api/notifications/settings — get current email notification setting
 *   POST /api/notifications/settings — update email notification setting
 */
import { getNotificationSettings, upsertNotificationSettings } from '../storage/d1.js';
import { getUserById } from '../middleware/auth.js';

/**
 * Handles GET /api/notifications/settings
 * Returns current notification settings for a user and project
 * @param {Request} request
 * @param {object} env
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
    } catch (err) {
        console.error('Failed to get notification settings:', err);
        return jsonResponse({ status: 'error', message: 'Failed to get settings' }, 500);
    }
}

/**
 * Handles POST /api/notifications/settings
 * Creates or updates notification settings for a user and project
 * @param {Request} request
 * @param {object} env
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