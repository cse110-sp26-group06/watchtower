import test from 'node:test';
import assert from 'node:assert/strict';

import { sinceToIso } from '../scripts/pages/errorList/errorFilter.js';

test('sinceToIso returns null for "all"', () => {
  assert.equal(sinceToIso('all'), null);
});

test('sinceToIso returns null for unknown shorthand', () => {
  assert.equal(sinceToIso('forever'), null);
});

test('sinceToIso returns a valid ISO string for "24h"', () => {
  const result = sinceToIso('24h');
  assert.ok(result !== null, 'should not be null');
  assert.ok(!isNaN(Date.parse(result)), 'should be a valid ISO string');
});

test('sinceToIso "24h" produces a timestamp approximately 24 hours ago', () => {
  const result = sinceToIso('24h');
  const diff = Date.now() - Date.parse(result);
  assert.ok(diff >= 23 * 60 * 60 * 1000, 'should be at least 23h ago');
  assert.ok(diff <= 25 * 60 * 60 * 1000, 'should be at most 25h ago');
});

test('sinceToIso returns a valid ISO string for "7d"', () => {
  const result = sinceToIso('7d');
  assert.ok(!isNaN(Date.parse(result)), 'should be a valid ISO string');
});

test('sinceToIso "7d" produces a timestamp approximately 7 days ago', () => {
  const result = sinceToIso('7d');
  const diff = Date.now() - Date.parse(result);
  assert.ok(diff >= 6.9 * 24 * 60 * 60 * 1000, 'should be at least ~7 days ago');
  assert.ok(diff <= 7.1 * 24 * 60 * 60 * 1000, 'should be at most ~7 days ago');
});

test('sinceToIso returns a valid ISO string for "30d"', () => {
  const result = sinceToIso('30d');
  assert.ok(!isNaN(Date.parse(result)), 'should be a valid ISO string');
});

test('sinceToIso "30d" produces a timestamp approximately 30 days ago', () => {
  const result = sinceToIso('30d');
  const diff = Date.now() - Date.parse(result);
  assert.ok(diff >= 29 * 24 * 60 * 60 * 1000, 'should be at least ~30 days ago');
  assert.ok(diff <= 31 * 24 * 60 * 60 * 1000, 'should be at most ~31 days ago');
});