import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

test('right-click shows context menu with expected items', async ({ page }) => {
  await keycloakLogin(page);
  const node = page.locator('mat-tree-node').first();
  await node.waitFor({ timeout: 10000 });
  await node.click({ button: 'right' });
  await expect(page.locator('[mat-menu-item]:has-text("Details")')).toBeVisible();
  await expect(page.locator('[mat-menu-item]:has-text("Back")')).toBeVisible();
});

test('ESC dismisses context menu', async ({ page }) => {
  await keycloakLogin(page);
  const node = page.locator('mat-tree-node').first();
  await node.waitFor({ timeout: 10000 });
  await node.click({ button: 'right' });
  const contextMenu = page.locator('.cdk-overlay-container .mat-mdc-menu-panel').first();
  await contextMenu.waitFor({ timeout: 3000 });
  await contextMenu.focus();
  await page.keyboard.press('Escape');
  await expect(contextMenu).not.toBeVisible({ timeout: 5000 });
});

test('Alt+Enter opens Details dialog', async ({ page }) => {
  await keycloakLogin(page);
  const node = page.locator('mat-tree-node').first();
  await node.waitFor({ timeout: 10000 });
  await node.click();
  await page.keyboard.press('Alt+Enter');
  await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 5000 });
});

test('Details from context menu opens dialog', async ({ page }) => {
  await keycloakLogin(page);
  const node = page.locator('mat-tree-node').first();
  await node.waitFor({ timeout: 10000 });
  await node.click();
  await node.click({ button: 'right' });
  await page.locator('[mat-menu-item]:has-text("Details")').click();
  await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 5000 });
});
