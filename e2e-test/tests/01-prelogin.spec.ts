import { test, expect } from '@playwright/test';

test('app loads', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  expect(page.url()).toContain('localhost');
});

test('login hint is visible before authentication', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.toolbar-login-hint')).toBeVisible({ timeout: 10000 });
});

test('profile menu shows Log in when not authenticated', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.toolbar-login-hint', { timeout: 10000 });
  await page.locator('button[aria-label="Profile menu"]').click();
  await expect(page.locator('button[mat-menu-item]:has-text("Log in")')).toBeVisible();
});
