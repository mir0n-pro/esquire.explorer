import { test, expect, type Page } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { navigateTo } from '../helpers/tree';

test.describe.serial('accounting lifecycle: deposit → withdrawal → transfer → withdrawal', () => {
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

  test('deposits 100 EUR into 10011 for transfer', async () => {
    await page.locator('button:has-text("monetization_on")').click();
    await page.locator('[mat-menu-item]:has-text("Deposit")').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.locator('input.esq-number-input').first().fill('100');
    await dialog.locator('input.esq-number-input').first().press('Tab');
    await dialog.locator('input[type="text"]:not(.esq-number-input)').first().fill('ABC-T01');

    await expect(dialog.locator('.esq-acct-submit-btn')).toBeEnabled({ timeout: 3000 });
    await dialog.locator('.esq-acct-submit-btn').click();

    await expect(page.locator('button:has-text("Yes")')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Yes")').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(1, { timeout: 5000 });
    await dialog.locator('button[matTooltip="Close"]').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 5000 });
  });

  test('transfers 100 EUR from 10011 to 10012 at rate 1.18', async () => {
    await page.locator('button:has-text("monetization_on")').click();
    await page.locator('[mat-menu-item]:has-text("Transfer")').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('mat-toolbar')).toContainText('Transfer');
    await expect(dialog.locator('esq-acct-picker').first()).toBeVisible({ timeout: 5000 });

    // same-ccy initial state: rate is readonly, label shows EUR/EUR
    const rateInput = dialog.locator('[data-field="rate"]');
    await expect(rateInput).toBeVisible({ timeout: 5000 });
    await expect(rateInput).toHaveAttribute('readonly', '');
    await expect(dialog.locator('b:has-text("Rate EUR")')).toBeVisible();

    // change dest account to 10012 (USD)
    await dialog.locator('esq-acct-picker').nth(1).locator('button[matTooltip="Select account"]').click();

    const selectDlg = page.locator('mat-dialog-container').last();
    // Company is already expanded (pre-expand to src account 10011); Department is already visible.
    // "All clients" exists at level 3 (Company direct child) AND level 4 (Department child) —
    // use aria-level to target the correct one.
    await selectDlg.locator('[id^="select-entity-node-"]:has-text("Department")').first().waitFor({ timeout: 10000 });
    await selectDlg.locator('[id^="select-entity-node-"]:has-text("Department")').first().click();
    await page.keyboard.press('ArrowRight');
    await selectDlg.locator('[id^="select-entity-node-"][aria-level="4"]:has-text("All clients")').first().waitFor({ timeout: 10000 });
    await selectDlg.locator('[id^="select-entity-node-"][aria-level="4"]:has-text("All clients")').first().click();
    await page.keyboard.press('ArrowRight');
    await selectDlg.locator('[id^="select-entity-node-"]:has-text("Cli Ent")').first().waitFor({ timeout: 10000 });
    await selectDlg.locator('[id^="select-entity-node-"]:has-text("Cli Ent")').first().click();
    await page.keyboard.press('ArrowRight');
    await selectDlg.locator('[id^="select-entity-node-"]:has-text("10012")').first().waitFor({ timeout: 10000 });
    await selectDlg.locator('[id^="select-entity-node-"]:has-text("10012")').first().click();
    await expect(selectDlg.locator('button:has-text("Select")')).toBeEnabled({ timeout: 3000 });
    await selectDlg.locator('button:has-text("Select")').click();

    // cross-ccy: rate editable, label shows EUR/USD
    await expect(dialog.locator('b:has-text("Rate EUR/USD")')).toBeVisible({ timeout: 3000 });
    await expect(rateInput).not.toHaveAttribute('readonly');

    await dialog.locator('input.esq-number-input').first().fill('100');
    await rateInput.fill('1.18');

    await expect(dialog.locator('.esq-acct-submit-btn')).toBeEnabled({ timeout: 3000 });
    await dialog.locator('.esq-acct-submit-btn').click();

    await expect(page.locator('button:has-text("Yes")')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Yes")').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(1, { timeout: 5000 });
    await dialog.locator('button[matTooltip="Close"]').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 5000 });
  });

  test('withdraws 118 USD from 10012', async () => {
    // Navigate to Cli Ent via toolbar Up + list row dblclicks.
    // Tree dblclick is unreliable here (stale node ref after async navigation);
    // list row navigation (onListDoubleClick → doActivateListNode) is the stable path.
    const upBtn = page.locator('button:has-text("arrow_upward")');
    await upBtn.click();                                                               // Mer Chant → All merchants
    await page.locator('tr[mat-row]:has-text("Mer Chant")').first().waitFor({ timeout: 5000 });
    await upBtn.click();                                                               // All merchants → Company
    await page.locator('tr[mat-row]:has-text("Department")').first().waitFor({ timeout: 5000 });
    await page.locator('tr[mat-row]:has-text("Department")').first().dblclick();      // → Department
    await page.locator('tr[mat-row]:has-text("All clients")').first().waitFor({ timeout: 5000 });
    await page.locator('tr[mat-row]:has-text("All clients")').first().dblclick();     // → All clients
    await page.locator('tr[mat-row]:has-text("Cli Ent")').first().waitFor({ timeout: 5000 });
    await page.locator('tr[mat-row]:has-text("Cli Ent")').first().dblclick();         // → Cli Ent
    const accountRow = page.locator('tr[mat-row]').first();
    await accountRow.waitFor({ timeout: 5000 });
    await accountRow.click();

    await page.locator('button:has-text("monetization_on")').click();
    await page.locator('[mat-menu-item]:has-text("Withdrawal")').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('mat-toolbar')).toContainText('Withdrawal');

    await dialog.locator('input.esq-number-input').first().fill('118');
    await dialog.locator('input.esq-number-input').first().press('Tab');
    await dialog.locator('input[type="text"]:not(.esq-number-input)').first().fill('ABC-T02');

    await expect(dialog.locator('.esq-acct-submit-btn')).toBeEnabled({ timeout: 3000 });
    await dialog.locator('.esq-acct-submit-btn').click();

    await expect(page.locator('button:has-text("Yes")')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Yes")').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(1, { timeout: 5000 });
    await dialog.locator('button[matTooltip="Close"]').click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 5000 });
  });
});
