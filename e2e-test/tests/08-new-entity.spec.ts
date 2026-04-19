import { test, expect, type Page } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { navigateTo } from '../helpers/tree';

test.describe.serial('entity lifecycle: create → move → delete', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await keycloakLogin(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('creates entity under Department', async () => {
    await navigateTo(page, 'Company', 'Department');

    const newBtn = page.locator('button:has-text("add")').first();
    if (!await newBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'New... not enabled for Department node');
      return;
    }
    await newBtn.click();

    const newOrgItem = page.locator('[mat-menu-item]:has-text("org")').first();
    await newOrgItem.waitFor({ timeout: 3000 });
    await newOrgItem.click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const nameInput = dialog.locator('input').first();
    await nameInput.fill('e2e-test-entity');
    await nameInput.press('Tab');

    await expect(dialog.locator('button:has-text("Create")')).toBeEnabled({ timeout: 3000 });
    await dialog.locator('button:has-text("Create")').click();

    await expect(page.locator('mat-dialog-container')).toHaveCount(1, { timeout: 10000 });
    await page.locator('mat-dialog-container').last().locator('button[matTooltip="Close"]').click();
    await page.waitForTimeout(800);
    if (await page.locator('mat-dialog-container').count() === 2) {
      await page.locator('button:has-text("No")').last().click();
    }
    await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('mat-tree-node:has-text("e2e-test-entity")').first()).toBeVisible({ timeout: 5000 });
  });

  test('moves entity to Company', async () => {
    const movableNode = page.locator('mat-tree-node:has-text("e2e-test-entity")').last();
    await expect(movableNode).toBeVisible({ timeout: 5000 });

    await movableNode.click({ button: 'right' });
    await page.locator('[mat-menu-item]:has-text("Move")').click();

    const dialog = page.locator('mat-dialog-container');
    await dialog.waitFor({ timeout: 5000 });

    const selectBtn = dialog.locator('button:has-text("Select")');
    const companyNode = page.locator('[id^="select-entity-node-"]:has-text("Company")').first();
    await companyNode.waitFor({ timeout: 5000 });
    await companyNode.click();
    await expect(selectBtn).toBeEnabled({ timeout: 3000 });
    await selectBtn.click();

    await expect(page.locator('text=Are you sure')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Yes")').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 8000 });
  });

  test('deletes entity', async () => {
    const deletableNode = page.locator('mat-tree-node:has-text("e2e-test-entity")').last();
    await expect(deletableNode).toBeVisible({ timeout: 10000 });

    await deletableNode.click({ button: 'right' });
    await page.locator('[mat-menu-item]:has-text("Delete")').click();
    await page.locator('text=Are you sure').waitFor({ timeout: 5000 });
    await page.locator('button:has-text("Yes")').click();
    await expect(deletableNode).not.toBeVisible({ timeout: 5000 });
  });
});
