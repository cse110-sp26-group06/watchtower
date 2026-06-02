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
  window.localStorage.setItem(
    'watchtower:projects',
    JSON.stringify([{
      id: 'project_1',
      name: 'Project 1',
      apiKey: 'wt_test_api_key_123',
      createdAt: '2026-05-20T00:00:00.000Z',
    }])
  );
  window.sessionStorage.setItem(
    'watchtower:current-project',
    JSON.stringify({
      id: 'project_1',
      name: 'Project 1',
      apiKey: 'wt_test_api_key_123',
      createdAt: '2026-05-20T00:00:00.000Z',
    })
  );
}

async function mockErrorApi(page, errors = [mockError], { onPatch } = {}) {
  await page.route(`${API_BASE}**`, async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      const url = new URL(request.url());
      const id = url.pathname.split('/').pop();
      const error = errors.find((item) => String(item.id) === String(id));

      if (!error) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Error not found' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', error }),
      });
      return;
    }

    if (request.method() === 'PATCH') {
      if (onPatch) { await onPatch(request); }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', message: 'Error marked as resolved' }),
      });
      return;
    }

    await route.fulfill({
      status: 405,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' }),
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

    test('marks the error as resolved through the API', async ({ page }) => {
      let detailUrl = '';
      let patchUrl = '';
      let patchBody = null;

      await page.unroute(`${API_BASE}**`);
      await mockErrorApi(page, [mockError], {
        onPatch: async (request) => {
          patchUrl = request.url();
          patchBody = request.postDataJSON();
        },
      });
      page.on('request', (request) => {
        const url = request.url();
        if (request.method() === 'GET' && url.includes(`/api/errors/${ERROR_ID}`)) {
          detailUrl = url;
        }
      });

      await page.goto(`/error-detail.html?id=${ERROR_ID}`);
      await page.locator('#resolve-btn').click();

      await expect(page.locator('#resolve-btn')).toHaveText('Resolved');
      await expect(page.locator('#resolve-btn')).toBeDisabled();
      expect(detailUrl).toContain(`/api/errors/${ERROR_ID}`);
      expect(new URL(detailUrl).searchParams.get('api_key')).toBe('wt_test_api_key_123');
      expect(patchUrl).toContain(`/api/errors/${ERROR_ID}`);
      expect(new URL(patchUrl).searchParams.get('api_key')).toBe('wt_test_api_key_123');
      expect(patchBody).toEqual({ status: 'resolved' });
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
