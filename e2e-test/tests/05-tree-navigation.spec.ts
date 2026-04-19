import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

test('selecting a node updates the path bar', async ({ page }) => {
  await keycloakLogin(page);
  const firstNode = page.locator('mat-tree-node').first();
  await firstNode.waitFor({ timeout: 10000 });
  await firstNode.click();
  await expect(page.locator('.esq-path-bar')).not.toBeEmpty({ timeout: 5000 });
});

test('Refresh button reloads the tree', async ({ page }) => {
  await keycloakLogin(page);
  await page.locator('mat-tree-node').first().waitFor({ timeout: 10000 });
  await page.locator('button[matTooltip="Refresh"]').click();
  await expect(page.locator('mat-tree-node').first()).toBeVisible({ timeout: 10000 });
});

test('Up button navigates to parent level', async ({ page }) => {
  await keycloakLogin(page);
  const firstNode = page.locator('mat-tree-node').first();
  await firstNode.waitFor({ timeout: 10000 });
  // expand root to get children, then click a child
  await firstNode.dblclick();
  const secondNode = page.locator('mat-tree-node').nth(1);
  await secondNode.waitFor({ timeout: 10000 });
  await secondNode.dblclick();
  await page.locator('button[matTooltip="Up one level "]').waitFor({ state: 'visible', timeout: 5000 });
  const pathBefore = await page.locator('.esq-path-bar').textContent();
  await page.locator('button[matTooltip="Up one level "]').click();
  const pathAfter = await page.locator('.esq-path-bar').textContent();
  expect(pathAfter).not.toBe(pathBefore);
});

test('Back and Forward navigation', async ({ page }) => {
  await keycloakLogin(page);
  const firstNode = page.locator('mat-tree-node').first();
  await firstNode.waitFor({ timeout: 10000 });
  await firstNode.click();
  // expand to get children, navigate to child
  await firstNode.dblclick();
  const secondNode = page.locator('mat-tree-node').nth(1);
  await secondNode.waitFor({ timeout: 10000 });
  await secondNode.click();
  // Back should now be enabled
  await expect(page.locator('button[matTooltip="Back"]')).toBeEnabled({ timeout: 5000 });
  await page.locator('button[matTooltip="Back"]').click();
  await expect(page.locator('button[matTooltip="Forward"]')).toBeEnabled({ timeout: 5000 });
  await page.locator('button[matTooltip="Forward"]').click();
  await expect(page.locator('mat-tree-node').first()).toBeVisible();
});
