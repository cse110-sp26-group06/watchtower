/**
 * @fileoverview Authentication and ownership helpers for backend routes.
 */

/**
 * Generates a project API key and stores it in the `projects` table.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} name - Project name.
 * @param {string} owner_id - Identifier of the user who owns the project.
 * @returns {Promise<object>} Created project record with its generated API key.
 */
export async function generateApiKey(env, name, owner_id) {
  const id = crypto.randomUUID();
  const api_key = 'wt_' + crypto.randomUUID().replace(/-/g, '');
  const created_at = new Date().toISOString();

  await env.watchtower_db.prepare(
    'INSERT INTO projects (id, name, api_key, created_at, owner_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, name, api_key, created_at, owner_id).run();

  return { id, name, api_key, created_at };
}

/**
 * Looks up a project by API key.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} api_key - API key to validate.
 * @returns {Promise<object|null>} Matching project record, or `null` when not found.
 */
export async function validateApiKey(env, api_key) {
  if (!api_key) {return null;}

  const project = await env.watchtower_db.prepare(
    'SELECT * FROM projects WHERE api_key = ?'
  ).bind(api_key).first();

  return project || null;
}

/**
 * Creates a user record keyed by email.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} email - User email address. Must be unique.
 * @returns {Promise<object>} Created user record.
 * @throws {Error} Thrown when the insert fails, including uniqueness violations.
 */
export async function createUser(env, email) {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  await env.watchtower_db.prepare(
    'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)'
  ).bind(id, email, created_at).run();

  return { id, email, created_at };
}

/**
 * Looks up a user by identifier.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} user_id - User identifier.
 * @returns {Promise<object|null>} Matching user record, or `null` when not found.
 */
export async function getUserById(env, user_id) {
  if (!user_id) {return null;}

  const user = await env.watchtower_db.prepare(
    'SELECT id, email, created_at FROM users WHERE id = ?'
  ).bind(user_id).first();

  return user || null;
}
