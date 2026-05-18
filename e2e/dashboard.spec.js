import { test, expect } from '@playwright/test';

async function signIn(page, email = 'user@example.com', password = 'password123') {
  const response = await page.goto('/index.html');

  expect(response?.ok()).toBeTruthy();
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test('dashboard index responds with the login landing page', async ({ page }) => {
  const response = await page.goto('/index.html');

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
});

test('login validates email and password before navigation', async ({ page }) => {
  await page.goto('/index.html');

  await page.getByLabel('Email Address').fill('invalid-email');
  await page.getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Password must be at least 8 characters long.')).toBeVisible();
});

test('successful login leads to the dashboard and exposes sign out', async ({ page }) => {
  await signIn(page, 'afsdasd@gmail.com');

  await expect(page).toHaveURL(/\/error-list\.html$/);
  await expect(page.getByRole('heading', { name: 'Error List' })).toBeVisible();
  await expect(page.getByRole('button', { name: /afsdasd@gmail\.com/i })).toBeVisible();
});

test('resolved errors disappear from the unresolved list after navigating back', async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/error-list\.html$/);

  const errorMessage = "TypeError: Cannot read property 'user' of undefined";
  const errorCard = page.locator('.error-card').filter({ hasText: errorMessage });

  await expect(errorCard).toHaveCount(1);
  await errorCard.click();

  await expect(page).toHaveURL(/\/error-detail\.html\?id=1$/);
  await page.getByRole('button', { name: 'Mark this error as resolved' }).click();
  await expect(page.getByRole('button', { name: 'Mark this error as resolved' })).toBeDisabled();

  await page.goBack();
  await expect(page).toHaveURL(/\/error-list\.html$/);
  await expect(errorCard).toHaveCount(0);
});
