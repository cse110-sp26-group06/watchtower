/* global crypto */
/**
 * Authentication middleware for WatchTower Backend
 * Handles API key generation and validation
 */

/**
 * Generates a unique API key and stores it in D1 projects table
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} name - project name
 * @returns {object} - project record with generated api_key
 */
export async function generateApiKey(env, name) {
  const id = crypto.randomUUID();
  const api_key = 'wt_' + crypto.randomUUID().replace(/-/g, '');
  const created_at = new Date().toISOString();

  await env.watchtower_db.prepare(
    'INSERT INTO projects (id, name, api_key, created_at) VALUES (?, ?, ?, ?)'
  ).bind(id, name, api_key, created_at).run();

  return { id, name, api_key, created_at };
}

/**
 * Validates an API key against the projects table in D1
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} api_key - the API key to validate
 * @returns {object|null} - project record if valid, null if invalid
 */
export async function validateApiKey(env, api_key) {
  if (!api_key) return null;

  const project = await env.watchtower_db.prepare(
    'SELECT * FROM projects WHERE api_key = ?'
  ).bind(api_key).first();

  return project || null;
}