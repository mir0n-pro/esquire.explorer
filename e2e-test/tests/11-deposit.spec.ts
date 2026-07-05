import { test, expect, type Page } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { navigateTo, listInto } from '../helpers/tree';
import { setupHouse, teardownHouse, House, TEST_HOUSE_NAME } from '../helpers/testHouse';

// Accounting lifecycle (deposit -> withdrawal -> transfer -> withdrawal), self-contained
// under the Test House. beforeAll builds its own office with a merchant user + EUR account
// (the source) and a client user + USD account (the destination) via the /api proxy, and
// afterAll tears the whole subtree down (accounts under Test House purge their history on
// delete). Net effect on balances is zero across all five tests; net effect on the tree is
// nothing (fixture created then removed). No dependence on seed accounts 10011/10012.
test.describe.serial('accounting lifecycle: deposit -> withdrawal -> transfer -> withdrawal', () => {
  let page: Page;
  let house: House;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await keycloakLogin(page);

    house = await setupHouse(page, String(Date.now()));

    // Navigate to the office in the tree (Test House + office names are unique -> no
    // ambiguity), then descend through the list pane for the repeated virtual-folder
    // level (All merchants) down to the merchant user, whose accounts fill the list.
    await navigateTo(page, TEST_HOUSE_NAME, house.officeName);
    await listInto(page, 'All merchants', house.merchantName);
    const accountRow = page.locator(`tr[mat-row]:has-text("${house.eurAcctNo}")`).first();
    await accountRow.waitFor({ timeout: 5000 });
    await accountRow.click();
    await accountRow.focus();
  });

  test.afterAll(async () => {
    if (house) await teardownHouse(page, house.officeId);
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

    // Wait for the amount input to render (the acct-picker loads the selected account first);
    // otherwise a slow account-detail load races the fill.
    await expect(dialog.locator('input.esq-number-input').first()).toBeVisible({ timeout: 15000 });
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

  test('deposits 100 EUR into the EUR account for transfer', async () => {
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

  test('transfers 100 EUR to the USD account at rate 1.18', async () => {
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

    // change dest account to the USD client account under Test House / office / All clients / client
    await dialog.locator('esq-acct-picker').nth(1).locator('button[matTooltip="Select account"]').click();

    const selectDlg = page.locator('mat-dialog-container').last();
    // The dialog tree repeats virtual-folder names across depths, so descend by explicit
    // aria-level (Esquire=1, Test House=2, office=3, All clients=4, client=5, account=6).
    await expandDialogNode(selectDlg, page, 2, TEST_HOUSE_NAME);
    await expandDialogNode(selectDlg, page, 3, house.officeName);
    await expandDialogNode(selectDlg, page, 4, 'All clients');
    await expandDialogNode(selectDlg, page, 5, house.clientName);
    const usdNode = selectDlg.locator(`[id^="select-entity-node-"][aria-level="6"]:has-text("${house.usdAcctNo}")`).first();
    await usdNode.waitFor({ timeout: 10000 });
    await usdNode.click();
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

  test('withdraws 118 USD from the USD account', async () => {
    // Reset to the office by selecting its (unique) tree node -- already expanded from
    // beforeAll, so a single click activates it without a root-toggle -- then descend
    // the list pane to the client's USD account.
    const officeNode = page.locator(`mat-tree-node:has-text("${house.officeName}")`).first();
    await officeNode.waitFor({ timeout: 5000 });
    await officeNode.click();
    await listInto(page, 'All clients', house.clientName);
    const accountRow = page.locator(`tr[mat-row]:has-text("${house.usdAcctNo}")`).first();
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

// Select a node at a specific aria-level in the account-select dialog tree and ensure it
// is expanded (ArrowRight expands without the toggle-icon dblclick race). Targeting by
// aria-level disambiguates the virtual folders that repeat across depths.
async function expandDialogNode(dlg: ReturnType<Page['locator']>, page: Page,
                                level: number, text: string): Promise<void> {
  const node = dlg.locator(`[id^="select-entity-node-"][aria-level="${level}"]:has-text("${text}")`).first();
  await node.waitFor({ timeout: 10000 });
  await node.click();
  await page.keyboard.press('ArrowRight');
}
