import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

test('Access Profile dialog opens and shows profile fields', async ({ page }) => {
  await keycloakLogin(page);
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Access Profile")').click();
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('mat-tab-group')).toBeVisible();
  await expect(dialog.locator('esq-tab-field').first()).toBeVisible({ timeout: 10000 });
});

test('Access Profile dialog closes', async ({ page }) => {
  await keycloakLogin(page);
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Access Profile")').click();
  await page.locator('mat-dialog-container').waitFor();
  await page.locator('mat-dialog-container button[matTooltip="Close"]').click();
  await expect(page.locator('mat-dialog-container')).not.toBeVisible();
});
