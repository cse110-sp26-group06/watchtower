/**
 * @file notification-routes.test.js
 * Integration tests for the notification settings endpoints.
 *
 * Tests covered:
 *   GET  /api/notifications/settings — returns current email toggle state
 *   POST /api/notifications/settings — saves email toggle state
 *
 * Verifies that notification preferences are correctly stored and retrieved,
 * that the upsert behavior works (update vs insert), and that invalid
 * requests are rejected with appropriate error codes.
 */
import { SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, test } from 'vitest';
import { resetTestDatabase } from './helpers/d1.js';

beforeEach(async () => {
  await resetTestDatabase();
});

async function createProject(email = 'test@example.com') {
  const userResponse = await SELF.fetch('http://example.com/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const user = await userResponse.json();
  const projectResponse = await SELF.fetch('http://example.com/api/key_generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Project', user_id: user.user_id }),
  });
  const project = await projectResponse.json();
  return { ...project, user_id: user.user_id };
}

describe('GET /api/notifications/settings', () => {
  test('returns email_enabled false when no settings exist', async () => {
    const project = await createProject();

    const response = await SELF.fetch(
      `http://example.com/api/notifications/settings?user_id=${project.user_id}&project_id=${project.project_id}`
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.email_enabled).toBe(false);
  });

  test('returns 400 when user_id is missing', async () => {
    const project = await createProject();

    const response = await SELF.fetch(
      `http://example.com/api/notifications/settings?project_id=${project.project_id}`
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('user_id and project_id required');
  });

  test('returns 404 for unknown user_id', async () => {
    const response = await SELF.fetch(
      'http://example.com/api/notifications/settings?user_id=unknown-id&project_id=unknown-id'
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe('Unknown user_id');
  });
});

describe('POST /api/notifications/settings', () => {
  test('enables email notifications', async () => {
    const project = await createProject();

    const response = await SELF.fetch('http://example.com/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: project.user_id,
        project_id: project.project_id,
        email_enabled: true,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.email_enabled).toBe(true);
  });

  test('disables email notifications', async () => {
    const project = await createProject();

    await SELF.fetch('http://example.com/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: project.user_id,
        project_id: project.project_id,
        email_enabled: true,
      }),
    });

    const response = await SELF.fetch('http://example.com/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: project.user_id,
        project_id: project.project_id,
        email_enabled: false,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.email_enabled).toBe(false);
  });

  test('returns 400 when email_enabled is not a boolean', async () => {
    const project = await createProject();

    const response = await SELF.fetch('http://example.com/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: project.user_id,
        project_id: project.project_id,
        email_enabled: 'yes',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('email_enabled must be a boolean');
  });

  test('returns 404 for unknown user_id', async () => {
    const response = await SELF.fetch('http://example.com/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'unknown-id',
        project_id: 'unknown-id',
        email_enabled: true,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe('Unknown user_id');
  });

  test('updates existing setting when called twice', async () => {
    const project = await createProject();

    await SELF.fetch('http://example.com/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: project.user_id,
        project_id: project.project_id,
        email_enabled: true,
      }),
    });

    await SELF.fetch('http://example.com/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: project.user_id,
        project_id: project.project_id,
        email_enabled: false,
      }),
    });

    const response = await SELF.fetch(
      `http://example.com/api/notifications/settings?user_id=${project.user_id}&project_id=${project.project_id}`
    );
    const body = await response.json();

    expect(body.email_enabled).toBe(false);
  });
});