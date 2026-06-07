/**
 * @file performance-routes.test.js
 * Integration tests for the performance ingestion and read endpoints.
 *
 * Tests covered:
 *   POST /ingest/performance — stores performance events from SDK
 *   GET  /api/performance    — reads performance events for Dashboard
 *
 * Verifies that performance events are correctly stored, retrieved,
 * filtered by entry_type, and that invalid requests are rejected.
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
  return projectResponse.json();
}

function performancePayload(api_key, entryType = 'navigation') {
  return {
    api_key,
    service: 'frontend',
    environment: 'test',
    events: [
      {
        event_type: 'performance',
        timestamp: '2026-05-29T10:00:00.000Z',
        payload: { name: 'page load', entryType, time: 100, duration: 234 },
      },
    ],
  };
}

async function ingestPerformance(api_key, entryType = 'navigation') {
  return SELF.fetch('http://example.com/ingest/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(performancePayload(api_key, entryType)),
  });
}

describe('POST /ingest/performance', () => {
  test('stores a valid performance event', async () => {
    const project = await createProject();
    const response = await ingestPerformance(project.api_key);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');

    const listResponse = await SELF.fetch(
      `http://example.com/api/performance?api_key=${project.api_key}`
    );
    const listBody = await listResponse.json();

    expect(listBody.performance).toHaveLength(1);
    expect(listBody.performance[0].name).toBe('page load');
    expect(listBody.performance[0].entry_type).toBe('navigation');
    expect(listBody.performance[0].duration).toBe(234);
  });

  test('rejects an invalid API key', async () => {
    const response = await ingestPerformance('bad_key');
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Invalid API key');
  });

  test('rejects missing required performance payload fields', async () => {
    const project = await createProject();
    const badPayload = performancePayload(project.api_key);
    delete badPayload.events[0].payload.duration;

    const response = await SELF.fetch('http://example.com/ingest/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badPayload),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Missing required event payload field: duration');
  });
});

describe('GET /api/performance', () => {
  test('lists performance events for a project', async () => {
    const project = await createProject();
    await ingestPerformance(project.api_key);

    const response = await SELF.fetch(
      `http://example.com/api/performance?api_key=${project.api_key}`
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.performance).toHaveLength(1);
  });

  test('filters by entry_type', async () => {
    const project = await createProject();
    await ingestPerformance(project.api_key, 'navigation');
    await ingestPerformance(project.api_key, 'resource');

    const response = await SELF.fetch(
      `http://example.com/api/performance?api_key=${project.api_key}&entry_type=navigation`
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.performance).toHaveLength(1);
    expect(body.performance[0].entry_type).toBe('navigation');
  });

  test('returns empty array when no events exist', async () => {
    const project = await createProject();

    const response = await SELF.fetch(
      `http://example.com/api/performance?api_key=${project.api_key}`
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.performance).toHaveLength(0);
  });
});