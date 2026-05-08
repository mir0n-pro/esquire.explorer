import { Page } from '@playwright/test';

export async function keycloakLogin(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('.toolbar-login-hint', { timeout: 10000 });
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Log in")').click();
  await page.waitForURL(/\/kc-auth\/realms\/esquire/, { timeout: 15000 });
  await page.fill('#username', process.env['E2E_USERNAME']!);
  await page.fill('#password', process.env['E2E_PASSWORD']!);
  await page.click('#kc-login');
  await page.waitForURL(url => !/\/kc-auth\/realms\/esquire/.test(url.href), { timeout: 15000 });
  await page.waitForSelector('.name-bar', { timeout: 15000 });
}
