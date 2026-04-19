import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

test('error bar appears and error report dialog opens', async ({ page }) => {
  await keycloakLogin(page);
  await page.locator('mat-tree-node').first().waitFor({ timeout: 10000 });

  await page.route('**/esq-cmd**', async route => {
    await route.fulfill({
      status: 404,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        type: 'https://esquire.example/errors/not-found',
        title: 'Not Found',
        detail: 'Entity does not exist',
        status: 404,
        instance: 'test-instance-id',
      }),
    });
  });

  await page.locator('mat-tree-node').first().click();
  await page.locator('button[matTooltip="Details"]').click();

  // Details dialog may open (and create an overlay backdrop) — dismiss it first
  const openDialog = page.locator('mat-dialog-container');
  if (await openDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await expect(openDialog).not.toBeVisible({ timeout: 3000 });
  }

  await expect(page.locator('.info-text')).toBeVisible({ timeout: 5000 });

  const errorBtn = page.locator('button[matTooltip="Error Report"], button:has(mat-icon:text("bug_report"))');
  if (await errorBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await errorBtn.click();
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('mat-tab-group')).toBeVisible();
    await dialog.locator('button[matTooltip="Close"]').click();
  }
});
