import { test, expect } from '@playwright/test';

test('app loads at localhost:4200', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  expect(page.url()).toContain('localhost:4200');
});

test('login hint is visible before authentication', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.login-hint-row')).toBeVisible({ timeout: 10000 });
});

test('profile menu shows Log in when not authenticated', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.login-hint-row', { timeout: 10000 });
  await page.locator('button[aria-label="Profile menu"]').click();
  await expect(page.locator('button[mat-menu-item]:has-text("Log in")')).toBeVisible();
});
