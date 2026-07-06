import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { listInto } from '../helpers/tree';
import { TEST_HOUSE_NAME } from '../helpers/testHouse';

// Regression guard for the ui.lib Details-dialog ESC/focus bug (v1.2.11 item U1).
//
// Seed data (db.seed initial-entities): Test House (org 14) contains the admin user
// "Test Driver" (usr 15, kind=32, editable -> readOnly=false). This is the exact case that
// reproduced U1 every time on the standard seed.
//
// U1 root cause + fix: the Details dialog opens aria-modal="false" (non-modal, no focus trap)
// and relies on its OWN ngAfterViewInit -> btnClose.focus() to move focus INTO the dialog, so
// its keydown.escape host-listener can catch ESC. The `#btnClose` template ref existed ONLY on
// the read-only branch, so for an EDITABLE entity btnClose was undefined, focus never entered
// the dialog, and ESC was ignored until a TAB moved focus inside. Fix (EsqEntityDetailsDialog /
// EsqNodeDetailsDialog templates): give the Close button `#btnClose` in the editable branches
// too, so focus always lands inside the dialog on open. After the fix a SINGLE ESC closes it.
test('Details on seeded admin Test House/Test Driver: a single ESC closes the dialog (U1 focus fix)', async ({ page }) => {
  await keycloakLogin(page);

  // Expand root (Esquire), then DESCEND into Test House (dblclick = navigate into, so the list
  // pane switches to Test House's children -- single-click only selects, it does not advance
  // the path bar). Then descend the "All admin-s" virtual folder in the list pane.
  const root = page.locator('mat-tree-node').first();
  await root.waitFor({ timeout: 10000 });
  await root.dblclick();
  const testHouse = page.locator(`mat-tree-node:has-text("${TEST_HOUSE_NAME}")`).first();
  await testHouse.waitFor({ timeout: 10000 });
  await testHouse.dblclick();
  await expect(page.locator('.esq-path-bar')).toContainText(TEST_HOUSE_NAME, { timeout: 10000 });
  await listInto(page, 'All admin-s');

  // Select the seeded "Test Driver" admin -- exact text so it is not "Test Driver S" / "M".
  const row = page.locator('tr[mat-row]')
    .filter({ has: page.getByText('Test Driver', { exact: true }) })
    .first();
  await row.waitFor({ timeout: 10000 });
  await row.click();

  // Open the Details dialog and let it FULLY load (a field is populated) so this is provably
  // the focus bug, not the originalDetails load-race that 07-details guards against.
  await page.locator('button[matTooltip="Details"]').click();
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await expect(dialog.locator('mat-tab-group')).toBeVisible();
  await expect(dialog.locator('input').first()).not.toHaveValue('', { timeout: 8000 });

  // Where does focus sit, and is it inside the dialog? (aria-modal=false -> no focus trap.)
  const activeInfo = () => page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return 'none';
    const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
    const inDialog = !!el.closest('mat-dialog-container');
    const label = el.getAttribute('mattooltip') || el.querySelector('img')?.textContent?.trim()
      || el.textContent?.trim().slice(0, 24) || '';
    return `${el.tagName}${disabled ? '[disabled]' : ''}${inDialog ? '[in-dialog]' : '[OUTSIDE]'} "${label}"`;
  });
  // After the U1 fix, focus lands INSIDE the dialog on open (on its Close button), so ESC
  // reaches the dialog's close handler with no preceding TAB.
  const focusAtOpen = await activeInfo();
  console.log('[u1] focus at open:', focusAtOpen);
  expect(focusAtOpen).toContain('[in-dialog]');

  // A SINGLE ESC closes the dialog (the reported defect is fixed).
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible({ timeout: 3000 });
});
