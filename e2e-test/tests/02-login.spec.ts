import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

test('Log in redirects to Keycloak', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.login-hint-row', { timeout: 10000 });
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Log in")').click();
  await page.waitForURL(/realms\/esquire/, { timeout: 15000 });
  expect(page.url()).toContain('realms/esquire');
});

test('login flow succeeds and shows explorer', async ({ page }) => {
  await keycloakLogin(page);
  await expect(page.locator('.name-bar')).toBeVisible();
  await expect(page.locator('.login-hint-row')).not.toBeVisible();
  await expect(page.locator('mat-tree-node').first()).toBeVisible({ timeout: 10000 });
});

test('logout: name-bar disappears and Log in is available', async ({ page }) => {
  await keycloakLogin(page);
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Log out")').click();
  // After logout keycloak redirects back with ?from=auth — login hint is suppressed,
  // but user is unauthenticated: name-bar is gone and Log in appears in profile menu
  await expect(page.locator('.name-bar')).not.toBeVisible({ timeout: 10000 });
  await page.locator('button[aria-label="Profile menu"]').click();
  await expect(page.locator('button[mat-menu-item]:has-text("Log in")')).toBeVisible();
});
