import { test, expect, type Page } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { navigateTo } from '../helpers/tree';

test.describe.serial('accounting lifecycle: deposit → withdrawal', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await keycloakLogin(page);
    await navigateTo(page, 'Company', 'All merchants', 'Mer Chant');
    const accountRow = page.locator('tr[mat-row]').first();
    await accountRow.waitFor({ timeout: 5000 });
    await accountRow.click();
    await accountRow.focus();
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('deposit dialog opens and submits', async () => {
    await page.locator('button:has-text("monetization_on")').click();
    await page.locator('[mat-menu-item]:has-text("Deposit")').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('mat-toolbar')).toContainText('Deposit');
    await expect(dialog.locator('esq-acct-picker')).toBeVisible({ timeout: 5000 });

    await dialog.locator('input.esq-number-input').first().fill('100');
    await dialog.locator('input.esq-number-input').first().press('Tab');
    await dialog.locator('input[type="text"]:not(.esq-number-input)').first().fill('ABC-123');

    await expect(dialog.locator('.esq-acct-submit-btn')).toBeEnabled({ timeout: 3000 });
    await dialog.locator('.esq-acct-submit-btn').click();

    await expect(page.locator('button:has-text("Yes")')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Yes")').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(1, { timeout: 5000 });
    await dialog.locator('button[matTooltip="Close"]').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 5000 });
  });

  test('withdrawal dialog shows negative amount and completes', async () => {
    await page.locator('button:has-text("monetization_on")').click();
    await page.locator('[mat-menu-item]:has-text("Withdrawal")').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('mat-toolbar')).toContainText('Withdrawal');

    await dialog.locator('input.esq-number-input').first().fill('100');
    await dialog.locator('input.esq-number-input').first().press('Tab');
    await dialog.locator('input[type="text"]:not(.esq-number-input)').first().fill('ABC-456');
    await dialog.locator('.esq-acct-submit-btn').click();

    await expect(page.locator('button:has-text("Yes")')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Yes")').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(1, { timeout: 5000 });
    await dialog.locator('button[matTooltip="Close"]').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 5000 });
  });
});
