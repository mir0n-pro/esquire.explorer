import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

test('Details dialog opens with tabbed form', async ({ page }) => {
  await keycloakLogin(page);
  const firstNode = page.locator('mat-tree-node').first();
  await firstNode.waitFor({ timeout: 10000 });
  await firstNode.click();
  await page.locator('button[matTooltip="Details"]').click();
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await expect(dialog.locator('mat-tab-group')).toBeVisible();
});

test('Details dialog closes with ESC', async ({ page }) => {
  await keycloakLogin(page);
  const node = page.locator('mat-tree-node').first();
  await node.waitFor({ timeout: 10000 });
  await node.click();
  await page.locator('button[matTooltip="Details"]').click();
  await page.locator('mat-dialog-container').waitFor();
  await page.keyboard.press('Escape');
  await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 3000 });
});

test('Details dialog closes with Close button', async ({ page }) => {
  await keycloakLogin(page);
  const node = page.locator('mat-tree-node').first();
  await node.waitFor({ timeout: 10000 });
  await node.click();
  await page.locator('button[matTooltip="Details"]').click();
  const dialog = page.locator('mat-dialog-container');
  await dialog.waitFor();
  await dialog.locator('button[matTooltip="Close"]').click();
  await expect(dialog).not.toBeVisible({ timeout: 3000 });
});
