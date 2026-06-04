
export async function storeError(env, record) {
  await env.watchtower_db.prepare(`
    INSERT INTO errors (id, api_key, service, environment, message, error_type, severity, stack_trace, file, lineno, colno, payload_json, client_timestamp, server_timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    record.id,
    record.api_key,
    record.service,
    record.environment,
    record.message,
    record.error_type,
    record.severity,
    record.stack_trace,
    record.file,
    record.lineno,
    record.colno,
    record.payload_json,
    record.client_timestamp,
    record.server_timestamp,
    record.status
  ).run();
}

/**
 * Reads errors from D1 for a given project (identified by api_key).
 * Called by handleGetErrors() in routes/errors.js.
 * Supports filtering by time range, severity, and status.
 * Results are paginated and sorted newest first.
 *
 * @param {object} env - Cloudflare Worker environment, contains D1 binding
 * @param {string} api_key - the project's API key to filter errors by
 * @param {object} params - optional query parameters for filtering
 * @param {string} [params.since] - ISO timestamp, only return errors after this time
 * @param {string} [params.severity] - filter by severity
 * @param {string} [params.status] - filter by status (resolved/unresolved)
 * @param {number} [params.page=1] - page number for pagination
 * @param {number} [params.limit=20] - number of results per page
 * @returns {object[]} array of error records from D1
 */
export async function getErrors(env, api_key, params = {}) {
  const { since, severity, status, page = 1, limit = 20 } = params;

  // calculate how many rows to skip based on current page
  const offset = (page - 1) * limit;

  // always filter by api_key so each project only sees their own errors
  let query = 'SELECT * FROM errors WHERE api_key = ?';
  const bindings = [api_key];

  // add optional filters only if provided
  if (since) {
    query += ' AND server_timestamp >= ?';
    bindings.push(since);
  }
  if (severity && severity !== 'all') {
    query += ' AND severity = ?';
    bindings.push(severity);
  }
  if (status && status !== 'all') {
    query += ' AND status = ?';
    bindings.push(status);
  }

  // sort newest first, then paginate
  query += ' ORDER BY server_timestamp DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const result = await env.watchtower_db.prepare(query).bind(...bindings).run();
  return result.results;
}

/**
 * Reads a single error from D1 by its id, scoped to the calling project's api_key.
 * Returns null if the error doesn't exist OR belongs to a different project —
 * the two cases are indistinguishable so cross-project access can't enumerate ids.
 *
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} id - the error's unique id
 * @param {string} api_key - the calling project's api_key
 * @returns {object|null} - error record or null if not found / not owned
 */
export async function getErrorById(env, id, api_key) {
  const result = await env.watchtower_db.prepare(
    'SELECT * FROM errors WHERE id = ? AND api_key = ?'
  ).bind(id, api_key).first();
  return result || null;
}

/**
 * Updates an error's status to 'resolved' in D1, scoped to the calling project's api_key.
 * Returns false if the error doesn't exist OR belongs to a different project.
 *
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} id - the error's unique id
 * @param {string} api_key - the calling project's api_key
 * @returns {boolean} - true if updated, false if not found / not owned
 */
export async function resolveError(env, id, api_key) {
  const result = await env.watchtower_db.prepare(
    'UPDATE errors SET status = ? WHERE id = ? AND api_key = ?'
  ).bind('resolved', id, api_key).run();

  return result.meta.changes > 0;
}

/**
 * Lists all projects owned by a given user, newest first.
 * Used by GET /api/projects to back the Dashboard's project-selection flow.
 *
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} owner_id - the user id
 * @returns {object[]} - array of project records
 */
export async function listProjectsByOwner(env, owner_id) {
  const result = await env.watchtower_db.prepare(
    'SELECT id, name, api_key, created_at FROM projects WHERE owner_id = ? ORDER BY created_at DESC'
  ).bind(owner_id).all();

  return result.results;
}

/**
 * Stores a performance event in D1
 * @param {object} env - Cloudflare env with D1 binding
 * @param {object} record - fully prepared record from ingest.js
 */
export async function storePerformance(env, record) {
  await env.watchtower_db.prepare(`
    INSERT INTO performance (id, api_key, service, environment, name, entry_type, time, duration, payload_json, client_timestamp, server_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    record.id,
    record.api_key,
    record.service,
    record.environment,
    record.name,
    record.entry_type,
    record.time,
    record.duration,
    record.payload_json,
    record.client_timestamp,
    record.server_timestamp
  ).run();
}

/**
 * Reads performance events from D1 for a given project
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} api_key - project api key
 * @param {object} params - optional filters
 * @param {string} [params.entry_type] - filter by resource/paint/navigation
 * @param {string} [params.since] - ISO timestamp
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {object[]}
 */
export async function getPerformance(env, api_key, params = {}) {
  const { entry_type, since, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM performance WHERE api_key = ?';
  const bindings = [api_key];

  if (entry_type && entry_type !== 'all') {
    query += ' AND entry_type = ?';
    bindings.push(entry_type);
  }
  if (since) {
    query += ' AND server_timestamp >= ?';
    bindings.push(since);
  }

  query += ' ORDER BY server_timestamp DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const result = await env.watchtower_db.prepare(query).bind(...bindings).run();
  return result.results;
}

/**
 * 
 * @param {object} env - Cloudflare env with D1 binding
 * @param {object} record - fully prepared record from ingest.js
 */
export async function storeLog(env, record) {
  await env.watchtower_db.prepare(`
    INSERT INTO logs (id, api_key, service, environment, level, message, payload_timestamp, payload_json, client_timestamp, server_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    record.id,
    record.api_key,
    record.service,
    record.environment,
    record.level,
    record.message,
    record.payload_timestamp,
    record.payload_json,
    record.client_timestamp,
    record.server_timestamp
  ).run();
}


export async function getLogs(env, api_key, params = {}) {
  const { level, since } = params;

  const page = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const limit = Number.isFinite(params.limit) && params.limit > 0 ? Math.floor(params.limit) : 20;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM logs WHERE api_key = ?';
  const bindings = [api_key];

  if (level && level !== 'all') {
    query += ' AND level = ?';
    bindings.push(level);
  }
  if (since) {
    query += ' AND server_timestamp >= ?';
    bindings.push(since);
  }

  query += ' ORDER BY server_timestamp DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const result = await env.watchtower_db.prepare(query).bind(...bindings).run();
  return result.results;
}
