/**
 * Authentication middleware for WatchTower Backend
 * Handles API key generation and validation
 */

/**
 * Generates a unique API key and stores it in D1 projects table
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} name - project name
 * @param {string} owner_id - the ID of the user who owns the project
 * @returns {object} - project record with generated api_key
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
 * Validates an API key against the projects table in D1
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} api_key - the API key to validate
 * @returns {object|null} - project record if valid, null if invalid
 */
export async function validateApiKey(env, api_key) {
  if (!api_key) {return null;}

  const project = await env.watchtower_db.prepare(
    'SELECT * FROM projects WHERE api_key = ?'
  ).bind(api_key).first();

  return project || null;
}

/**
 * Creates a new user row keyed by email.
 * Sprint 4 stub: no password — identity is the user_id returned here.
 * Real auth (password, sessions) deferred.
 *
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} email - the user's email (must be unique)
 * @returns {object} - { id, email, created_at }
 * @throws if email is already taken (D1 UNIQUE constraint violation)
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
 * Looks up a user by id. Used to verify a user_id query param refers to a real user
 * before treating it as a project owner. Returns null if not found.
 *
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} user_id - the user's id
 * @returns {object|null} - user record or null
 */
export async function getUserById(env, user_id) {
  if (!user_id) {return null;}

  const user = await env.watchtower_db.prepare(
    'SELECT id, email, created_at FROM users WHERE id = ?'
  ).bind(user_id).first();

  return user || null;
}
