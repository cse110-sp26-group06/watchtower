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