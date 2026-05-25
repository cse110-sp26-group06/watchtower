/* global window */
/**
 * errorDetail.spec.js — deterministic Playwright tests for error-detail.html
 */

import { test, expect } from '@playwright/test';

const ERROR_ID = 'err_1';
const API_BASE = 'https://watchtower-backend.group6.workers.dev/api/errors';

test.describe.configure({ mode: 'serial' });

const mockError = {
  id: ERROR_ID,
  service: 'web',
  environment: 'production',
  error_type: 'TypeError',
  severity: 'critical',
  status: 'unresolved',
  message: 'Cannot read properties of undefined',
  file: 'app.js',
  lineno: 42,
  colno: 7,
  stack_trace: 'TypeError: Cannot read properties of undefined\n    at renderUser (app.js:42:7)',
  client_timestamp: '2026-05-20T00:00:00.000Z',
  server_timestamp: '2026-05-20T00:05:00.000Z',
  payload_json: JSON.stringify({
    occurrences: 3,
    affectedUsers: 2,
    timeline: [
      { type: 'critical', label: 'Error captured', time: '2026-05-20T00:00:00.000Z' },
    ],
  }),
};

function seedSession() {
  window.localStorage.setItem(
    'watchtower:session',
    JSON.stringify({ email: 'test@ucsd.edu' })
  );
}

async function mockErrorApi(page, errors = [mockError]) {
  await page.route(`${API_BASE}**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ errors }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('Error Detail page', () => {
  test.describe('authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(seedSession);
      await mockErrorApi(page);
    });

    test('renders error detail data from the API', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(`/error-detail.html?id=${ERROR_ID}`);
      await expect(page.locator('.detail-card')).toBeVisible();
      await expect(page.locator('.detail-card__message')).toHaveText(mockError.message);
      await expect(page.locator('.badge')).toHaveText('CRITICAL');
      await expect(page.locator('.detail-stat')).toHaveCount(4);
      await expect(page.locator('.stack-trace')).toBeVisible();
      await expect(page.locator('#resolve-btn')).toHaveText('Mark Resolved');
      await expect(page).toHaveTitle(/WatchTower/);
      await expect(page).not.toHaveTitle('Error Detail');

      await expect(page.locator('#navbar-root #navbar')).toBeVisible();
      await expect(page.locator('#nav-error-list')).toBeVisible();
      expect(errors).toHaveLength(0);
    });

    test('back link navigates to error-list.html', async ({ page }) => {
      await page.goto(`/error-detail.html?id=${ERROR_ID}`);

      await page.locator('#back-link').click();
      await expect(page).toHaveURL(/error-list\.html/);
    });
  });

  test('redirects to login when no session', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${ERROR_ID}`);

    await expect(page).toHaveURL(/index\.html\?next=/);
  });

  test('no ID in URL renders error state', async ({ page }) => {
    await page.addInitScript(seedSession);
    await page.goto('/error-detail.html');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#detail-root')).toContainText('No error ID specified');
  });

  test('invalid ID renders error state', async ({ page }) => {
    await page.addInitScript(seedSession);
    await mockErrorApi(page, []);
    await page.goto('/error-detail.html?id=does-not-exist');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#detail-root')).toContainText('Could not load error');
    await expect(page.locator('#detail-root')).toContainText('No error found with that ID.');
  });
});
