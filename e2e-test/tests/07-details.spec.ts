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
  const dialog = page.locator('mat-dialog-container');
  await dialog.waitFor();
  // The tab-group renders BEFORE the dictionary/details finish loading, so waiting for it is not
  // enough: against a remote backend ESC can fire while details are still in flight → originalDetails
  // is not yet synced → hasChanges() returns true → the unsaved-changes guard holds the dialog open
  // instead of closing (passes locally where latency ≈ 0, fails against OKE). Wait until a field is
  // actually POPULATED — proof the details loaded and originalDetails is set — before pressing ESC.
  await dialog.locator('mat-tab-group').waitFor({ state: 'visible', timeout: 5000 });
  await expect(dialog.locator('input').first()).not.toHaveValue('', { timeout: 8000 });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible({ timeout: 3000 });
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
