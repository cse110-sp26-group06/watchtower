import { test, expect } from '@playwright/test';

test('dashboard index responds', async ({ page }) => {
  const response = await page.goto('/index.html');

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/index\.html$/);
});
