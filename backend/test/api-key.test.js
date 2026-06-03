// BE-6: api-key test
import { SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, test } from 'vitest';
import { resetTestDatabase } from './helpers/d1.js';

beforeEach(async () => {
  await resetTestDatabase();
});

async function createUser(email = 'test@example.com') {
  const response = await SELF.fetch('http://example.com/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const body = await response.json();
  expect(response.status).toBe(201);
  return body.user_id;
}

describe('POST /api/key_generate', () => {
  test('creates a project and returns an API key', async () => {
    const user_id = await createUser();

    const response = await SELF.fetch('http://example.com/api/key_generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Project', user_id }),
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.status).toBe('ok');
    expect(body.project_id).toBeTruthy();
    expect(body.api_key).toMatch(/^wt_/);
  });

  test('returns 400 when project name is missing', async () => {
    const user_id = await createUser();

    const response = await SELF.fetch('http://example.com/api/key_generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Project name required');
  });

  test('returns 400 with invalid JSON', async () => {
    const response = await SELF.fetch('http://example.com/api/key_generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Invalid JSON');
  });
});
