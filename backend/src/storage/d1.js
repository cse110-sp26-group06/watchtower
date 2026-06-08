
/**
 * @fileoverview D1 persistence helpers for backend routes and cron jobs.
 */

/**
 * Stores an error record in D1.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {object} record - Fully prepared error record from `routes/ingest.js`.
 * @returns {Promise<void>} Resolves when the record has been inserted.
 */
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
 * Reads paginated errors from D1 for a project.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} api_key - Project API key used to scope results.
 * @param {object} [params={}] - Optional query parameters for filtering.
 * @param {string} [params.since] - ISO timestamp; only returns errors after this time.
 * @param {string} [params.severity] - Severity filter.
 * @param {string} [params.status] - Status filter such as `resolved` or `unresolved`.
 * @param {number} [params.page=1] - Page number for pagination.
 * @param {number} [params.limit=20] - Number of results per page.
 * @returns {Promise<object[]>} Matching error records.
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
 * Reads a single error by identifier, scoped to the calling project.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} id - Error identifier.
 * @param {string} api_key - Calling project's API key.
 * @returns {Promise<object|null>} Matching error record, or `null` if not found or not owned.
 */
export async function getErrorById(env, id, api_key) {
  const result = await env.watchtower_db.prepare(
    'SELECT * FROM errors WHERE id = ? AND api_key = ?'
  ).bind(id, api_key).first();
  return result || null;
}

/**
 * Marks an error as resolved, scoped to the calling project.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} id - Error identifier.
 * @param {string} api_key - Calling project's API key.
 * @returns {Promise<boolean>} `true` when a row was updated; otherwise `false`.
 */
export async function resolveError(env, id, api_key) {
  const result = await env.watchtower_db.prepare(
    'UPDATE errors SET status = ? WHERE id = ? AND api_key = ?'
  ).bind('resolved', id, api_key).run();

  return result.meta.changes > 0;
}

/**
 * Lists projects owned by a user, newest first.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} owner_id - User identifier.
 * @returns {Promise<object[]>} Project records for the user.
 */
export async function listProjectsByOwner(env, owner_id) {
  const result = await env.watchtower_db.prepare(
    'SELECT id, name, api_key, created_at FROM projects WHERE owner_id = ? ORDER BY created_at DESC'
  ).bind(owner_id).all();

  return result.results;
}

/**
 * Stores a performance record in D1.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {object} record - Fully prepared performance record from `routes/ingest.js`.
 * @returns {Promise<void>} Resolves when the record has been inserted.
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
 * Reads paginated performance events for a project.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} api_key - Project API key used to scope results.
 * @param {object} [params={}] - Optional filters.
 * @param {string} [params.entry_type] - Entry type filter such as `resource` or `navigation`.
 * @param {string} [params.since] - ISO timestamp; only returns events after this time.
 * @param {number} [params.page=1] - Page number for pagination.
 * @param {number} [params.limit=20] - Number of results per page.
 * @returns {Promise<object[]>} Matching performance records.
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
 * Stores a log record in D1.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {object} record - Fully prepared log record from `routes/ingest.js`.
 * @returns {Promise<void>} Resolves when the record has been inserted.
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

/**
 * Reads paginated log events for a project.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} api_key - Project API key used to scope results.
 * @param {object} [params={}] - Optional filters.
 * @param {string} [params.level] - Log level filter such as `debug`, `info`, `warn`, or `error`.
 * @param {string} [params.since] - ISO timestamp; only returns logs after this time.
 * @param {number} [params.page=1] - Page number for pagination.
 * @param {number} [params.limit=20] - Number of results per page.
 * @returns {Promise<object[]>} Matching log records.
 */
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

/**
 * Gets notification settings for a user and project.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} user_id - User identifier.
 * @param {string} project_id - Project identifier.
 * @returns {Promise<object|null>} Notification settings, or `null` if none exist.
 */
export async function getNotificationSettings(env, user_id, project_id) {
  const result = await env.watchtower_db.prepare(
    'SELECT * FROM notification_settings WHERE user_id = ? AND project_id = ?'
  ).bind(user_id, project_id).first();
  return result || null;
}

/**
 * Creates or updates notification settings for a user and project.
 *
 * @param {object} env - Cloudflare Worker environment with the D1 binding.
 * @param {string} user_id - User identifier.
 * @param {string} project_id - Project identifier.
 * @param {boolean} email_enabled - Whether email notifications are enabled.
 * @returns {Promise<void>} Resolves after the notification settings are persisted.
 */
export async function upsertNotificationSettings(env, user_id, project_id, email_enabled) {
  const existing = await getNotificationSettings(env, user_id, project_id);
  const now = new Date().toISOString();

  if (existing) {
    await env.watchtower_db.prepare(
      'UPDATE notification_settings SET email_enabled = ?, updated_at = ? WHERE user_id = ? AND project_id = ?'
    ).bind(email_enabled ? 1 : 0, now, user_id, project_id).run();
  } else {
    await env.watchtower_db.prepare(
      'INSERT INTO notification_settings (id, user_id, project_id, email_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), user_id, project_id, email_enabled ? 1 : 0, now, now).run();
  }
}
