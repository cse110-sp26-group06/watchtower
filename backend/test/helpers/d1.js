/**
 * BE-6
 * Reads schema.sql
 * Execute each statement against env.watchtower_db
 * Reset D1 between tests
 */
import { env, reset } from 'cloudflare:test';

// Keep this in sync with backend/schema.sql until backend has formal D1 migrations.
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS errors (
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
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )`,
];

export async function resetTestDatabase() {
    await reset();

    // apply schema.sql to env.watchtower_db
    for (const statement of SCHEMA_STATEMENTS) {
        await env.watchtower_db.prepare(statement).run();
    }
}