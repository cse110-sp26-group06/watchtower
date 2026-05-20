/**
 * errorDetail.spec.js — Playwright tests for error-detail.html
 */

import { test, expect } from '@playwright/test';

// Real ID from confirmed live data
const REAL_ID = 'a32f9624-0574-44a7-b236-9ac27025d515';

test.describe('Error Detail page', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'watchtower:session',
        JSON.stringify({ email: 'test@ucsd.edu' })
      );
    });
  });

  test('page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('renders navbar', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await expect(page.locator('#navbar-root')).not.toBeEmpty();
  });

  test('renders detail card with message', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.detail-card')).toBeVisible();
    await expect(page.locator('.detail-card__message')).not.toBeEmpty();
  });

  test('renders severity badge', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.badge')).toBeVisible();
  });

  test('renders stats cards', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.waitForLoadState('networkidle');
    const stats = page.locator('.detail-stat');
    await expect(stats).toHaveCount(4);
  });

  test('renders stack trace section when stackTrace is present', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.waitForLoadState('networkidle');
    const stack = page.locator('.stack-trace');
    const count = await stack.count();
    if (count > 0) {
      await expect(stack).toBeVisible();
    }
  });

  test('resolve button is present and labeled correctly', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.waitForLoadState('networkidle');
    const btn = page.locator('#resolve-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText(/Mark Resolved|✓ Resolved/);
  });

  test('back link navigates to error-list.html', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.locator('#back-link').click();
    await expect(page).toHaveURL(/error-list\.html/);
  });

  test('no ID in URL renders error state', async ({ page }) => {
    await page.goto('/error-detail.html');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#detail-root')).toContainText('No error ID specified');
  });

  test('invalid ID renders error state', async ({ page }) => {
    await page.goto('/error-detail.html?id=does-not-exist');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#detail-root')).toContainText('Could not load error');
  });

  test('document title updates with error severity and message', async ({ page }) => {
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    expect(title).toMatch(/WatchTower/);
    expect(title).not.toBe('Error Detail'); // default title should be overwritten
  });

  test('redirects to login when no session', async ({ page }) => {
    // No session injected — requireAuth() should redirect
    await page.goto(`/error-detail.html?id=${REAL_ID}`);
    await expect(page).toHaveURL(/login\.html/);
  });

});