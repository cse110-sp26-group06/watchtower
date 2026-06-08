/**
 * @fileoverview Handles dashboard routes for listing projects owned by a user.
 */

import { jsonResponse } from '../index.js';
import { getUserById } from '../middleware/auth.js';
import { listProjectsByOwner } from '../storage/d1.js';

/**
 * Returns the projects owned by the user identified by the `x-user-id` header.
 *
 * @param {Request} request - Incoming dashboard request.
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @returns {Promise<Response>} JSON response containing owned projects or an error message.
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
