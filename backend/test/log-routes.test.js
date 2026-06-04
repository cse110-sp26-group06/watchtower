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

function logPayload(api_key, message = 'Application started') {
  return {
    api_key,
    service: 'frontend',
    environment: 'test',
    events: [
      {
        event_type: 'log',
        timestamp: '2026-06-01T10:00:00.000Z',
        payload: {
          level: 'info',
          message,
          timestamp: '2026-06-01T10:00:00.000Z',
        },
      },
    ],
  };
}

async function ingestLog(api_key, message) {
  return SELF.fetch('http://example.com/ingest/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logPayload(api_key, message)),
  });
}

describe('Log ingestion and read endpoints', () => {
  test('stores a valid log and lists it', async () => {
    const project = await createProject();

    const ingestResponse = await ingestLog(project.api_key);
    const ingestBody = await ingestResponse.json();

    expect(ingestResponse.status).toBe(200);
    expect(ingestBody.status).toBe('ok');

    const listResponse = await SELF.fetch(
      `http://example.com/api/logs?api_key=${project.api_key}`
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.status).toBe('ok');
    expect(listBody.logs).toHaveLength(1);
    expect(listBody.logs[0].message).toBe('Application started');
    expect(listBody.logs[0].level).toBe('info');
  });

  test('rejects missing required log payload fields', async () => {
    const project = await createProject();
    const badPayload = logPayload(project.api_key);
    delete badPayload.events[0].payload.timestamp;

    const response = await SELF.fetch('http://example.com/ingest/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badPayload),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Missing required event payload field: timestamp');
  });

  test('returns logs scoped to the requesting project', async () => {
    const projectOne = await createProject('first@example.com');
    const projectTwo = await createProject('second@example.com');

    await ingestLog(projectOne.api_key, 'Project one log');
    await ingestLog(projectTwo.api_key, 'Project two log');

    const response = await SELF.fetch(
      `http://example.com/api/logs?api_key=${projectOne.api_key}`
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].message).toBe('Project one log');
  });
});
