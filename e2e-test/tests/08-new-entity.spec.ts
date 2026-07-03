import { test, expect, type Page } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { navigateTo } from '../helpers/tree';
import { createOffice, teardownHouse, TEST_HOUSE_NAME } from '../helpers/testHouse';

// Entity lifecycle (create -> move -> delete), self-contained under the Test House.
// The spec builds its OWN two offices under Test House (org 14) via the /api proxy in
// beforeAll and removes them in afterAll, so it never touches the shared seed tree
// (Company / Department). The lifecycle entity is created in the source office, moved
// to the destination office, and deleted.
test.describe.serial('entity lifecycle: create -> move -> delete', () => {
  let page: Page;
  let srcOffice: { id: string; name: string };
  let dstOffice: { id: string; name: string };

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await keycloakLogin(page);

    const tag = String(Date.now());
    srcOffice = await createOffice(page, `e2e-lifecycle-src-${tag}`);
    dstOffice = await createOffice(page, `e2e-lifecycle-dst-${tag}`);
  });

  test.afterAll(async () => {
    if (srcOffice) await teardownHouse(page, srcOffice.id);
    if (dstOffice) await teardownHouse(page, dstOffice.id);
    await page.context().close();
  });

  test('creates entity under the source office', async () => {
    await navigateTo(page, TEST_HOUSE_NAME, srcOffice.name);

    const newBtn = page.locator('button:has-text("add")').first();
    await expect(newBtn).toBeEnabled({ timeout: 5000 });
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

  test('moves entity to the destination office', async () => {
    const movableNode = page.locator('mat-tree-node:has-text("e2e-test-entity")').last();
    await expect(movableNode).toBeVisible({ timeout: 5000 });

    await movableNode.click({ button: 'right' });
    await page.locator('[mat-menu-item]:has-text("Move")').click();

    const dialog = page.locator('mat-dialog-container');
    await dialog.waitFor({ timeout: 5000 });

    // Destination office lives under Test House -> expand Test House, then pick it.
    const houseNode = dialog.locator(`[id^="select-entity-node-"]:has-text("${TEST_HOUSE_NAME}")`).first();
    await houseNode.waitFor({ timeout: 5000 });
    await houseNode.click();
    await page.keyboard.press('ArrowRight');

    const dstNode = dialog.locator(`[id^="select-entity-node-"]:has-text("${dstOffice.name}")`).first();
    await dstNode.waitFor({ timeout: 5000 });
    await dstNode.click();

    const selectBtn = dialog.locator('button:has-text("Select")');
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
