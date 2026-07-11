import { test, expect, type Page } from '@playwright/test';
import { existsSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { keycloakLogin } from '../helpers/auth';
import { navigateTo, listInto } from '../helpers/tree';
import { setupHouse, teardownHouse, House, TEST_HOUSE_NAME } from '../helpers/testHouse';

// Gentle stop: a lap always tears its own subtree down (the finally below), so the safe place to stop is
// BETWEEN laps. A stop is requested by the marker file cycle/.stop (run cycle-stop.bat) OR by Ctrl-C (the
// SIGINT handler writes the same marker). Each lap checks it at the TOP -- before creating anything -- and
// skips if set, so the in-flight lap completes its teardown and no new lap begins. Ctrl-C is best-effort for
// the CURRENT lap (Playwright may interrupt it); cycle-stop.bat is the clean "finish this lap, then stop".
const STOP_MARKER = join(__dirname, '.stop');
let stopRequested = false;
function stopIsRequested(): boolean { return stopRequested || existsSync(STOP_MARKER); }
process.on('SIGINT', () => { stopRequested = true; try { writeFileSync(STOP_MARKER, ''); } catch { /* best effort */ } });

// Full-lifecycle CYCLE job (soak / activity generator), built by REUSING the proven e2e-test building blocks:
// setupHouse / teardownHouse (helpers), navigateTo / listInto (helpers), and the deposit / withdrawal dialog
// flow from spec 11. Each lap runs on a FRESH PAGE (new tab in the logged-in context) so the tree starts clean
// and the proven navigation works exactly as in the suite -- no re-invented tree walking. A lap:
//   build the working subtree (office + merchant user + EUR account) -> navigate to it (READ: enyMan/bizTree)
//   -> Connect the user (GUI: the flag that runs keySmith -> kcMaster -> Keycloak) -> deposit -> withdraw
//   -> Disconnect -> tear the subtree down.
// Each GUI op is followed by a render pause (RENDER_MS) so the run reads as real GUI work. CYCLES sets laps.
//
// Watch it in action: Grafana http://localhost:3009 (o11y profile on) -- the "Esquire Services" dashboard and
// the Tempo trace waterfall light up across gateway / enyMan / pacMan / keySmith / kcMaster / bizTree / auKeep.

const CYCLES = Number(process.env['CYCLES'] ?? '2');
const RENDER = Number(process.env['RENDER_MS'] ?? '1000');

async function settle(page: Page, ms = RENDER) { await page.waitForTimeout(ms); }

// Deposit / Withdrawal through the account dialog -- the exact flow spec 11 uses (monetization menu -> dialog
// -> amount + reference -> Submit -> Yes). The account row must be selected first.
async function guiAcct(page: Page, kind: 'Deposit' | 'Withdrawal', amount: string, ref: string) {
  await page.locator('button:has-text("monetization_on")').click();
  await page.locator(`[mat-menu-item]:has-text("${kind}")`).click();
  const dlg = page.locator('mat-dialog-container');
  await expect(dlg).toBeVisible({ timeout: 5000 });
  await expect(dlg.locator('input.esq-number-input').first()).toBeVisible({ timeout: 15000 });
  await dlg.locator('input.esq-number-input').first().fill(amount);
  await dlg.locator('input.esq-number-input').first().press('Tab');
  await dlg.locator('input[type="text"]:not(.esq-number-input)').first().fill(ref);
  await settle(page, 600);
  await dlg.locator('.esq-acct-submit-btn').click();
  await expect(page.locator('button:has-text("Yes")')).toBeVisible({ timeout: 5000 });
  await page.locator('button:has-text("Yes")').click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(1, { timeout: 8000 });
  await dlg.locator('button[matTooltip="Close"]').click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 5000 });
  await settle(page);
}

// Connect / Disconnect the user through the access dialog (verified_user toolbar button). The Connect flag is
// a native <select data-field="connectFlg">; connecting runs keySmith -> kcMaster -> Keycloak to provision the
// credentials. Save persists in-place, then Close dismisses. The user row must be selected first.
async function guiConnect(page: Page, connect: boolean) {
  await page.locator('button:has-text("verified_user")').first().click();
  const dlg = page.locator('mat-dialog-container');
  await expect(dlg).toBeVisible({ timeout: 5000 });
  await settle(page, 700);
  await dlg.locator('select[data-field="connectFlg"]').selectOption(connect ? 'Y' : 'N');
  await settle(page, 500);
  const save = dlg.locator('button:has-text("Save")');
  await expect(save).toBeEnabled({ timeout: 6000 });
  await save.click();
  await settle(page, 1500);   // let the keySmith -> kcMaster -> Keycloak sync land
  await dlg.locator('button:has-text("Close")').first().click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0, { timeout: 8000 });
  await settle(page);
}

test.describe.serial(`GUI lifecycle cycle x${CYCLES} under ${TEST_HOUSE_NAME}`, () => {
  let ctx: import('@playwright/test').BrowserContext;

  test.beforeAll(async ({ browser }) => {
    try { rmSync(STOP_MARKER); } catch { /* no stale marker */ }   // clear any leftover stop flag
    ctx = await browser.newContext();
    const loginPage = await ctx.newPage();
    await keycloakLogin(loginPage);           // establish the session once; each lap reuses the cookie
    await loginPage.close();
  });

  test.afterAll(async () => {
    try { rmSync(STOP_MARKER); } catch { /* nothing to clear */ }
    await ctx.close();
  });

  for (let lap = 1; lap <= CYCLES; lap++) {
    test(`lap ${lap}/${CYCLES}: build -> navigate -> connect -> deposit -> withdraw -> disconnect -> teardown`, async () => {
      test.skip(stopIsRequested(), 'stop requested -- finishing gracefully between laps');
      const page = await ctx.newPage();                    // FRESH tab -> clean tree; proven navigation works
      await page.goto('/');
      await page.waitForSelector('.name-bar', { timeout: 30000 });
      let house: House | undefined;
      try {
        // build the working subtree (office + merchant user + EUR account) -- reuse the helper
        house = await setupHouse(page, `${Date.now()}-${lap}`);

        // READ path: navigate to the account (exercises enyMan + bizTree tree/list reads)
        await navigateTo(page, TEST_HOUSE_NAME, house.officeName);
        await settle(page);
        await listInto(page, 'All merchants', house.merchantName);
        await settle(page);

        // Connect the user (set credentials): select the user in the office list, then the access dialog.
        // The merchant node is the current node after listInto; navigate up one level to select its row.
        await page.locator('button[matTooltip="Up one level "]').first().click();
        await settle(page);
        const urow = page.locator(`tr[mat-row]:has-text("${house.merchantName}")`).first();
        await urow.waitFor({ timeout: 8000 });
        await urow.click();
        await settle(page, 700);
        await guiConnect(page, true);

        // Deposit + Withdrawal on the EUR account (select its row first)
        await urow.dblclick();                             // into the user -> its accounts
        await settle(page);
        const arow = page.locator(`tr[mat-row]:has-text("${house.eurAcctNo}")`).first();
        await arow.waitFor({ timeout: 8000 });
        await arow.click();
        await settle(page, 700);
        await guiAcct(page, 'Deposit', '100', `DEP-${lap}`);
        await guiAcct(page, 'Withdrawal', '100', `WDR-${lap}`);

        // Disconnect the user (remove credentials)
        await page.locator('button[matTooltip="Up one level "]').first().click();
        await settle(page);
        await urow.click();
        await settle(page, 700);
        await guiConnect(page, false);

        console.log(`  [GUI lap ${lap}/${CYCLES}] build -> connect -> deposit -> withdraw -> disconnect  OK  (acct ${house.eurAcctNo})`);
      } finally {
        if (house) await teardownHouse(page, house.officeId);   // reuse the helper (self-purges under Test House)
        await page.close();
      }
    });
  }
});
