-- BE-3: D1 schema for WatchTower
-- Run with: wrangler d1 execute watchtower-db --file=schema.sql

-- TODO: define tables for errors, logs, performance events

-- Storing error events received from POST
CREATE TABLE IF NOT EXISTS errors (
    id TEXT PRIMARY KEY,
    api_key TEXT NOT NULL,
    service TEXT NOT NULL,
    environment TEXT NOT NULL,

    message TEXT NOT NULL,
    error_type TEXT,
    severity TEXT NOT NULL DEFAULT 'error',

    stack_trace_json TEXT NOT NULL,
    payload_json TEXT NOT NULL,

    client_timestamp TEXT NOT NULL,
    server_timestamp TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'unresolved'
);

CREATE INDEX IF NOT EXISTS idx_errors_service_time
ON errors (service, server_timestamp);

CREATE INDEX IF NOT EXISTS idx_errors_status
ON errors (status);

CREATE INDEX IF NOT EXISTS idx_errors_severity
ON errors (severity);