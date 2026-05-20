import test from 'node:test';
import assert from 'node:assert/strict';

// ── fetch mock helper ────────────────────────────────────────────
function mockFetch(status, body, throws = false) {
  globalThis.fetch = async () => {
    if (throws) {throw new TypeError('Failed to fetch');}
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  };
}

const { apiGet } = await import('../scripts/api/api.js');

// ── Tests ────────────────────────────────────────────────────────

test('apiGet returns success shape on 200', async () => {
  mockFetch(200, { status: 'ok', errors: [] });
  const result = await apiGet('', {});
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { status: 'ok', errors: [] });
});

test('apiGet returns network error type when fetch throws', async () => {
  mockFetch(0, null, true);
  const result = await apiGet('', {});
  assert.equal(result.success, false);
  assert.equal(result.error.type, 'network');
});

test('apiGet returns client error type on 401', async () => {
  mockFetch(401, { message: 'Unauthorized' });
  const result = await apiGet('', {});
  assert.equal(result.success, false);
  assert.equal(result.error.type, 'client');
  assert.equal(result.error.status, 401);
});

test('apiGet returns client error type on 403', async () => {
  mockFetch(403, { message: 'Forbidden' });
  const result = await apiGet('', {});
  assert.equal(result.success, false);
  assert.equal(result.error.type, 'client');
  assert.equal(result.error.status, 403);
});

test('apiGet returns client error type on 404', async () => {
  mockFetch(404, { message: 'Not found' });
  const result = await apiGet('', {});
  assert.equal(result.success, false);
  assert.equal(result.error.type, 'client');
  assert.equal(result.error.status, 404);
});

test('apiGet returns server error type on 500', async () => {
  mockFetch(500, { message: 'Internal Server Error' });
  const result = await apiGet('', {});
  assert.equal(result.success, false);
  assert.equal(result.error.type, 'server');
});

test('apiGet always injects api_key as a query param', async () => {
  let capturedUrl = '';
  globalThis.fetch = async (url) => {
    capturedUrl = url;
    return { ok: true, status: 200, json: async () => ({}) };
  };
  await apiGet('', {});
  assert.ok(capturedUrl.includes('api_key='), 'api_key must be present in URL');
});

test('apiGet does not send X-Api-Key header that triggers CORS preflight', async () => {
  let capturedHeaders = {};
  globalThis.fetch = async (url, opts) => {
    capturedHeaders = opts?.headers ?? {};
    return { ok: true, status: 200, json: async () => ({}) };
  };
  await apiGet('', {});
  const keys = Object.keys(capturedHeaders).map(k => k.toLowerCase());
  assert.ok(!keys.includes('x-api-key'), 'must not send X-Api-Key header');
  assert.ok(!keys.includes('authorization'), 'must not send Authorization header');
});