// BE-3: D1 storage layer
// TODO: implement write and read functions for events

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