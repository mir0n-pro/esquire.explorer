import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

test('tree loads nodes from API', async ({ page }) => {
  await keycloakLogin(page);
  await expect(page.locator('mat-tree-node').first()).toBeVisible({ timeout: 10000 });
});

test('tree node expands on double-click to show children', async ({ page }) => {
  await keycloakLogin(page);
  const firstNode = page.locator('mat-tree-node').first();
  await firstNode.waitFor({ timeout: 10000 });
  const countBefore = await page.locator('mat-tree-node').count();
  await firstNode.dblclick();
  // wait for child nodes to appear
  await expect(page.locator('mat-tree-node').nth(countBefore)).toBeVisible({ timeout: 10000 });
});
