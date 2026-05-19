/* global window */
import { test, expect } from '@playwright/test';

async function signIn(page, email = 'user@example.com', password = 'password123') {
  const response = await page.goto('/index.html');

  expect(response?.ok()).toBeTruthy();
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.waitForTimeout(500);
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

test('successful login leads to the projects view', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('watchtower:projects')) {
      window.localStorage.setItem('watchtower:projects', JSON.stringify([
        {
          id: 'proj_123',
          name: 'Project 1',
          apiKey: 'wt_test_api_key_123',
          createdAt: '2026-05-19T00:00:00.000Z',
        },
      ]));
    }
  });

  await signIn(page, 'afsdasd@gmail.com');

  await expect(page).toHaveURL(/\/projects\.html$/);
  await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();
  await expect(page.getByText(/Logged in as afsdasd@gmail\.com/i)).toBeVisible();
});

test('onboarding generates an API key and returns the user to the projects list', async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/onboarding\.html$/);

  await page.route('https://watchtower-backend.group6.workers.dev/api/key_generate', async (route) => {
    const payload = route.request().postDataJSON();

    expect(payload).toEqual({ name: 'Project 1' });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        project_id: 'proj_123',
        api_key: 'wt_test_api_key_123',
      }),
    });
  });

  await expect(page.getByLabel('Project Name')).toBeVisible();
  await expect(page.getByLabel('Project Name')).toHaveValue('Project 1');

  await page.getByRole('button', { name: 'Generate API Key' }).click();

  await expect(page.getByRole('heading', { name: 'Your Project is Ready!' })).toBeVisible();
  await expect(page.getByLabel('API Key', { exact: true })).toHaveValue('wt_test_api_key_123');
  await expect(page.locator('#snippet-api-key')).toHaveText('wt_test_api_key_123');

  const storedProjects = await page.evaluate(() => JSON.parse(window.localStorage.getItem('watchtower:projects') ?? '[]'));
  expect(storedProjects).toEqual([
    {
      id: 'proj_123',
      name: 'Project 1',
      apiKey: 'wt_test_api_key_123',
      createdAt: storedProjects[0].createdAt,
    },
  ]);

  await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

  await expect(page).toHaveURL(/\/projects\.html$/);
  await expect(page.locator('.project-item')).toContainText('Project 1');
});

test('projects overflow menu supports rename and delete actions', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('watchtower:session')) {
      window.localStorage.setItem('watchtower:session', JSON.stringify({ email: 'user@example.com' }));
    }
    if (!window.localStorage.getItem('watchtower:projects')) {
      window.localStorage.setItem('watchtower:projects', JSON.stringify([
        {
          id: 'proj_123',
          name: 'Project 1',
          apiKey: 'wt_test_api_key_123',
          createdAt: '2026-05-19T00:00:00.000Z',
        },
      ]));
    }
  });

  const response = await page.goto('/projects.html');

  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt');
    expect(dialog.message()).toBe('Rename project');
    await dialog.accept('Renamed Project');
  });

  await page.getByLabel('Project actions for Project 1').click();
  await page.getByRole('menuitem', { name: 'Rename Project' }).click();
  await expect(page.locator('.project-item')).toContainText('Renamed Project');

  const renamedProjects = await page.evaluate(() => JSON.parse(window.localStorage.getItem('watchtower:projects') ?? '[]'));
  expect(renamedProjects[0]?.name).toBe('Renamed Project');

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toBe('Delete "Renamed Project"?');
    await dialog.accept();
  });

  await page.getByLabel('Project actions for Renamed Project').click();
  await page.getByRole('menuitem', { name: 'Delete Project' }).click();

  await expect(page).toHaveURL(/\/onboarding\.html$/);
  await expect(page.getByLabel('Project Name')).toHaveValue('Project 1');
});

test('resolved errors disappear from the unresolved list after navigating back', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('watchtower:projects')) {
      window.localStorage.setItem('watchtower:projects', JSON.stringify([
        {
          id: 'proj_123',
          name: 'Project 1',
          apiKey: 'wt_test_api_key_123',
          createdAt: '2026-05-19T00:00:00.000Z',
        },
      ]));
    }
  });

  await signIn(page);
  await expect(page).toHaveURL(/\/projects\.html$/);
  await page.goto('/error-list.html');
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
