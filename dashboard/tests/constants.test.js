import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeError } from '../scripts/utils/constants.js';

const RAW_ROW = {
  id: 'abc-123',
  service: 'my-app',
  environment: 'production',
  message: 'TypeError crashed',
  error_type: 'TypeError',
  severity: 'error',
  stack_trace: 'TypeError at app.js:42',
  payload_json: JSON.stringify({ deploy: 'v1.2', occurrences: 5 }),
  client_timestamp: '2026-05-16T10:00:00.000Z',
  server_timestamp: '2026-05-16T10:00:01.000Z',
  status: 'unresolved',
  file: 'app.js',
  lineno: 42,
  colno: 15,
};

test('normalizeError maps id correctly', () => {
  assert.equal(normalizeError(RAW_ROW).id, 'abc-123');
});

test('normalizeError maps service and environment', () => {
  const n = normalizeError(RAW_ROW);
  assert.equal(n.service, 'my-app');
  assert.equal(n.environment, 'production');
});

test('normalizeError maps message and errorType', () => {
  const n = normalizeError(RAW_ROW);
  assert.equal(n.message, 'TypeError crashed');
  assert.equal(n.errorType, 'TypeError');
});

test('normalizeError maps stack_trace plain string to stackTrace', () => {
  const n = normalizeError(RAW_ROW);
  assert.equal(typeof n.stackTrace, 'string');
  assert.equal(n.stackTrace, 'TypeError at app.js:42');
});

test('normalizeError maps client_timestamp to firstSeen', () => {
  assert.equal(normalizeError(RAW_ROW).firstSeen, '2026-05-16T10:00:00.000Z');
});

test('normalizeError maps server_timestamp to lastSeen', () => {
  assert.equal(normalizeError(RAW_ROW).lastSeen, '2026-05-16T10:00:01.000Z');
});

test('normalizeError maps file, lineno, colno from top-level D1 columns', () => {
  const n = normalizeError(RAW_ROW);
  assert.equal(n.file, 'app.js');
  assert.equal(n.lineno, 42);
  assert.equal(n.colno, 15);
});

test('normalizeError parses payload_json and extracts known fields', () => {
  const n = normalizeError(RAW_ROW);
  assert.equal(n.deploy, 'v1.2');
  assert.equal(n.occurrences, 5);
});

test('normalizeError falls back to empty defaults on invalid payload_json', () => {
  const n = normalizeError({ ...RAW_ROW, payload_json: 'not-json' });
  assert.equal(n.occurrences, 0);
  assert.equal(n.affectedUsers, 0);
});

test('normalizeError preserves status column value', () => {
  assert.equal(normalizeError(RAW_ROW).status, 'unresolved');
});

test('normalizeError handles missing optional fields with safe defaults', () => {
  const n = normalizeError({ id: '1', message: 'oops' });
  assert.equal(n.stackTrace, '');
  assert.equal(n.occurrences, 0);
  assert.equal(n.affectedUsers, 0);
});