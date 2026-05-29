/**
 * routes/projects.js
 * Handles project management requests from the Dashboard's onboarding /
 * project-selection flow.
 *
 * Current endpoints:
 *   GET /api/projects (+ x-user-id header) — list projects owned by the given user
 *
 * Sprint 4 stub: caller identity is a user_id header. Real auth (sessions)
 * deferred to next sprint.
 */

import { jsonResponse } from '../index.js';
import { getUserById } from '../middleware/auth.js';
import { listProjectsByOwner } from '../storage/d1.js';

/**
 * Handles GET /api/projects with x-user-id header.
 * Returns the projects owned by the given user.
 *
 * @param {Request} request
 * @param {object} env - Cloudflare env with D1 binding
 * @returns {Response}
 */
export async function handleListProjects(request, env) {
  const user_id = request.headers.get('x-user-id');

  const owner = await getUserById(env, user_id);
  if (!owner) {
    return jsonResponse({ status: 'error', message: 'Unknown user_id' }, 404);
  }

  try {
    const projects = await listProjectsByOwner(env, owner.id);
    return jsonResponse({ status: 'ok', projects }, 200);
  } catch (err) {
    console.error('Failed to list projects:', err);
    return jsonResponse({ status: 'error', message: 'Failed to list projects' }, 500);
  }
}
