import { test, expect } from '@playwright/test';

test('dashboard index responds', async ({ page }) => {
  const response = await page.goto('/index.html');

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/index\.html$/);
});

test('resolved errors disappear from the unresolved list after navigating back', async ({ page }) => {
  await page.goto('/index.html');

  const errorMessage = "TypeError: Cannot read property 'user' of undefined";
  const errorCard = page.locator('.error-card').filter({ hasText: errorMessage });

  await expect(errorCard).toHaveCount(1);
  await errorCard.click();

  await expect(page).toHaveURL(/\/error-detail\.html\?id=1$/);
  await page.getByRole('button', { name: 'Mark this error as resolved' }).click();
  await expect(page.getByRole('button', { name: 'Mark this error as resolved' })).toBeDisabled();

  await page.goBack();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(errorCard).toHaveCount(0);
});
