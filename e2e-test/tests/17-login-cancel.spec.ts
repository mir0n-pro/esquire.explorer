import { test, expect } from '@playwright/test';

// The KeyCloak login page (esquire-explorer theme) offers a Cancel link back to the app,
// so a user who lands on login can abandon it without authenticating.

async function goToLogin(page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('.toolbar-login-hint', { timeout: 30000 });
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Log in")').click();
  await page.waitForURL(/\/realms\/esquire/, { timeout: 30000 });
}

test('login page shows a Cancel link that returns to the app', async ({ page }) => {
  await goToLogin(page);
  const cancel = page.locator('#esq-cancel');
  await expect(cancel).toBeVisible({ timeout: 30000 });
  await expect(cancel).toHaveText(/cancel/i);
  await cancel.click();
  await page.waitForURL(url => !/\/realms\/esquire/.test(url.href), { timeout: 30000 });
  await expect(page.locator('.toolbar-login-hint')).toBeVisible({ timeout: 30000 });
});

test('Cancel link persists across a failed-login re-render', async ({ page }) => {
  await goToLogin(page);
  // Wrong credentials -> KC re-renders login.ftl; the URL no longer carries redirect_uri,
  // so the Cancel target must survive via sessionStorage.
  await page.fill('#username', 'nobody');
  await page.fill('#password', 'definitely-wrong');
  await page.click('#kc-login');
  const cancel = page.locator('#esq-cancel');
  await expect(cancel).toBeVisible({ timeout: 30000 });
  await cancel.click();
  await page.waitForURL(url => !/\/realms\/esquire/.test(url.href), { timeout: 30000 });
  await expect(page.locator('.toolbar-login-hint')).toBeVisible({ timeout: 30000 });
});
