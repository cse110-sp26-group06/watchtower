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