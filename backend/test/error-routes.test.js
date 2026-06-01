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
    body: JSON.stringify({
      name: 'Test Project',
      user_id: user.user_id,
    }),
  });

  return projectResponse.json();
}

function errorPayload(api_key) {
  return {
    api_key,
    service: 'frontend',
    environment: 'test',
    events: [
      {
        event_type: 'error',
        timestamp: '2026-05-29T10:00:00.000Z',
        payload: {
          message: 'Button crashed',
          type: 'TypeError',
          severity: 'error',
          stack_trace: 'TypeError: Button crashed\n    at Button.jsx:10:5',
          file: 'Button.jsx',
          lineno: 10,
          colno: 5,
        },
      },
    ],
  };
}

async function ingestError(api_key) {
  return SELF.fetch('http://example.com/ingest/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorPayload(api_key)),
  });
}

describe('POST /ingest/error', () => {
  test('stores a valid error event', async () => {
    const project = await createProject();

    const response = await ingestError(project.api_key);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');

    const listResponse = await SELF.fetch(
      `http://example.com/api/errors?api_key=${project.api_key}`
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.errors).toHaveLength(1);
    expect(listBody.errors[0].message).toBe('Button crashed');
    expect(listBody.errors[0].error_type).toBe('TypeError');
    expect(listBody.errors[0].status).toBe('unresolved');
  });

  test('rejects an invalid API key', async () => {
    const response = await ingestError('bad_key');
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Invalid API key');
  });

  test('rejects missing required error payload fields', async () => {
    const project = await createProject();

    const badPayload = errorPayload(project.api_key);
    delete badPayload.events[0].payload.stack_trace;

    const response = await SELF.fetch('http://example.com/ingest/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badPayload),
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Missing required event payload field: stack_trace');
  });
});

describe('Dashboard error read endpoints', () => {
  test('lists errors for a project', async () => {
    const project = await createProject();

    await ingestError(project.api_key);

    const response = await SELF.fetch(
      `http://example.com/api/errors?api_key=${project.api_key}`
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].message).toBe('Button crashed');
  });

  test('reads a single error by id', async () => {
    const project = await createProject();

    await ingestError(project.api_key);

    const listResponse = await SELF.fetch(
      `http://example.com/api/errors?api_key=${project.api_key}`
    );
    const listBody = await listResponse.json();
    const errorId = listBody.errors[0].id;

    const detailResponse = await SELF.fetch(
      `http://example.com/api/errors/${errorId}?api_key=${project.api_key}`
    );
    const detailBody = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailBody.status).toBe('ok');
    expect(detailBody.error.id).toBe(errorId);
    expect(detailBody.error.message).toBe('Button crashed');
  });

  test('returns 404 for a missing error detail', async () => {
    const project = await createProject();

    const response = await SELF.fetch(
      `http://example.com/api/errors/missing-id?api_key=${project.api_key}`
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Error not found');
  });
});

describe('PATCH /api/errors/:id', () => {
  test('marks an error as resolved', async () => {
    const project = await createProject();

    await ingestError(project.api_key);

    const listResponse = await SELF.fetch(
      `http://example.com/api/errors?api_key=${project.api_key}`
    );
    const listBody = await listResponse.json();
    const errorId = listBody.errors[0].id;

    const patchResponse = await SELF.fetch(
      `http://example.com/api/errors/${errorId}?api_key=${project.api_key}`,
      { method: 'PATCH' }
    );
    const patchBody = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchBody.status).toBe('ok');
    expect(patchBody.message).toBe('Error marked as resolved');

    const detailResponse = await SELF.fetch(
      `http://example.com/api/errors/${errorId}?api_key=${project.api_key}`
    );
    const detailBody = await detailResponse.json();

    expect(detailBody.error.status).toBe('resolved');
  });

  test('returns 404 when resolving an unknown error', async () => {
    const project = await createProject();

    const response = await SELF.fetch(
      `http://example.com/api/errors/missing-id?api_key=${project.api_key}`,
      { method: 'PATCH' }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Error not found');
  });
});
