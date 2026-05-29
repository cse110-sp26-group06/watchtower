// Cross-project ownership tests for sprint 4 backend ownership work.
// Verifies:
//   - project B's api_key cannot read/resolve project A's error
//   - GET /api/projects scopes to the calling user_id
//   - missing/invalid user_id → 404 on project listing

import { env, SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, test } from 'vitest';
import schemaSql from '../schema.sql?raw';

async function applySchema() {
  // Strip SQL comments and split on `;` — D1 prepare() only handles one stmt at a time.
  const stripped = schemaSql.replace(/--[^\n]*\n/g, '\n');
  const statements = stripped
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await env.watchtower_db.prepare(stmt).run();
  }
}

async function resetDb() {
  // Order matters: drop child tables before parents.
  await env.watchtower_db.prepare('DROP TABLE IF EXISTS errors').run();
  await env.watchtower_db.prepare('DROP TABLE IF EXISTS projects').run();
  await env.watchtower_db.prepare('DROP TABLE IF EXISTS users').run();
  await applySchema();
}

async function seedUser(email) {
  const res = await SELF.fetch('http://test/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  expect(res.status).toBe(201);
  return (await res.json()).user_id;
}

async function seedProject(user_id, name) {
  const res = await SELF.fetch('http://test/api/key_generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, name }),
  });
  expect(res.status).toBe(201);
  return await res.json(); // { project_id, api_key }
}

async function seedError(api_key) {
  // Insert directly via D1 — the SDK ingest path is overkill for ownership tests.
  const id = crypto.randomUUID();
  await env.watchtower_db.prepare(`
    INSERT INTO errors (id, api_key, service, environment, message, error_type, severity,
                        stack_trace, file, lineno, colno, payload_json,
                        client_timestamp, server_timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, api_key, 'test-service', 'test', 'boom', 'TypeError', 'error',
    'stack', 'file.js', 1, 1, '{}',
    new Date().toISOString(), new Date().toISOString(), 'unresolved'
  ).run();
  return id;
}

describe('cross-project ownership', () => {
  beforeEach(resetDb);

  test("project B's api_key cannot read project A's error (404, not 200)", async () => {
    const userA = await seedUser('a@test.com');
    const userB = await seedUser('b@test.com');
    const projectA = await seedProject(userA, 'A');
    const projectB = await seedProject(userB, 'B');
    const errorId = await seedError(projectA.api_key);

    const res = await SELF.fetch(
      `http://test/api/errors/${errorId}?api_key=${projectB.api_key}`,
      { method: 'GET' }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe('Error not found');
  });

  test("project A's api_key can read project A's own error", async () => {
    const userA = await seedUser('a@test.com');
    const projectA = await seedProject(userA, 'A');
    const errorId = await seedError(projectA.api_key);

    const res = await SELF.fetch(
      `http://test/api/errors/${errorId}?api_key=${projectA.api_key}`,
      { method: 'GET' }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.id).toBe(errorId);
  });

  test("project B's api_key cannot resolve project A's error", async () => {
    const userA = await seedUser('a@test.com');
    const userB = await seedUser('b@test.com');
    const projectA = await seedProject(userA, 'A');
    const projectB = await seedProject(userB, 'B');
    const errorId = await seedError(projectA.api_key);

    const res = await SELF.fetch(
      `http://test/api/errors/${errorId}?api_key=${projectB.api_key}`,
      { method: 'PATCH' }
    );

    expect(res.status).toBe(404);

    // Confirm the row was NOT actually marked resolved.
    const row = await env.watchtower_db
      .prepare('SELECT status FROM errors WHERE id = ?')
      .bind(errorId)
      .first();
    expect(row.status).toBe('unresolved');
  });

  test('missing api_key → 401 on both by-id endpoints', async () => {
    const userA = await seedUser('a@test.com');
    const projectA = await seedProject(userA, 'A');
    const errorId = await seedError(projectA.api_key);

    const getRes = await SELF.fetch(`http://test/api/errors/${errorId}`, { method: 'GET' });
    expect(getRes.status).toBe(401);

    const patchRes = await SELF.fetch(`http://test/api/errors/${errorId}`, { method: 'PATCH' });
    expect(patchRes.status).toBe(401);
  });
});

describe('project listing scoping', () => {
  beforeEach(resetDb);

  test('GET /api/projects only returns the calling user\'s projects', async () => {
    const userA = await seedUser('a@test.com');
    const userB = await seedUser('b@test.com');
    await seedProject(userA, 'A-1');
    await seedProject(userA, 'A-2');
    await seedProject(userB, 'B-1');

    const res = await SELF.fetch(`http://test/api/projects?user_id=${userA}`, { method: 'GET' });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.projects).toHaveLength(2);
    const names = body.projects.map(p => p.name).sort();
    expect(names).toEqual(['A-1', 'A-2']);
  });

  test('GET /api/projects with unknown user_id → 404', async () => {
    const res = await SELF.fetch('http://test/api/projects?user_id=does-not-exist', { method: 'GET' });
    expect(res.status).toBe(404);
  });

  test('GET /api/projects with missing user_id → 404', async () => {
    const res = await SELF.fetch('http://test/api/projects', { method: 'GET' });
    expect(res.status).toBe(404);
  });
});
