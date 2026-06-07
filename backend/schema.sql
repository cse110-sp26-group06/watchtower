-- Run with: wrangler d1 execute watchtower-db --file=schema.sql
-- Existing DBs created before owner_id was added should also run:
-- wrangler d1 execute watchtower-db --file=migrations/20260529_add_projects_owner_id.sql

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

    stack_trace TEXT NOT NULL,
    file TEXT NOT NULL,
    lineno INTEGER NOT NULL,
    colno INTEGER NOT NULL,

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

-- This is the authentication table which stores the authentication key for each 
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    owner_id TEXT 
);

-- This is the users table which stores the user information for each project. Each user can have multiple projects, but each project can only have one user (the owner).
-- Sprint 4 stub: no password yet — callers identify themselves with a user_id query param. Real auth (password_hash, sessions) deferred to next sprint.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_owner
ON projects (owner_id);

-- This is the performance table which stores the performance info according to sdk schema
CREATE TABLE IF NOT EXISTS performance (
    id TEXT PRIMARY KEY,
    api_key TEXT NOT NULL,
    service TEXT NOT NULL,
    environment TEXT NOT NULL,
    name TEXT NOT NULL,
    entry_type TEXT NOT NULL,
    time REAL NOT NULL,
    duration REAL NOT NULL,
    payload_json TEXT NOT NULL,
    client_timestamp TEXT NOT NULL,
    server_timestamp TEXT NOT NULL,
    FOREIGN KEY (api_key) REFERENCES projects(api_key)
);

-- This is the logs table which stores log info according to sdk schema 
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    api_key TEXT NOT NULL,
    service TEXT NOT NULL,
    environment TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    payload_timestamp TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    client_timestamp TEXT NOT NULL,
    server_timestamp TEXT NOT NULL,
    FOREIGN KEY (api_key) REFERENCES projects(api_key)
);


CREATE INDEX IF NOT EXISTS idx_logs_api_key
ON logs (api_key);

CREATE INDEX IF NOT EXISTS idx_logs_level
ON logs (level);

CREATE INDEX IF NOT EXISTS idx_logs_server_timestamp
ON logs (server_timestamp);

CREATE INDEX IF NOT EXISTS idx_performance_api_key
ON performance (api_key);

CREATE INDEX IF NOT EXISTS idx_performance_entry_type
ON performance (entry_type);

CREATE INDEX IF NOT EXISTS idx_performance_server_timestamp
ON performance (server_timestamp);

-- Notification settings — stores whether a user wants daily email digests per project
CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    email_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user
ON notification_settings (user_id);