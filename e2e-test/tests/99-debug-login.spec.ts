import { test } from '@playwright/test';

test('debug: capture every network request during login', async ({ page }) => {
  const events: string[] = [];

  page.on('request', req => events.push(`> ${req.method()} ${req.url()}`));
  page.on('response', res => events.push(`< ${res.status()} ${res.url()}`));
  page.on('console', msg => events.push(`[console.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => events.push(`[PAGEERROR] ${err.message}`));
  page.on('requestfailed', req => events.push(`[REQFAIL] ${req.method()} ${req.url()} -- ${req.failure()?.errorText}`));

  await page.goto('/');
  await page.waitForSelector('.toolbar-login-hint', { timeout: 10000 });
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Log in")').click();
  await page.waitForURL(/\/kc-auth\/realms\/esquire/, { timeout: 15000 });
  await page.fill('#username', 'mainadmin');
  await page.fill('#password', 'q');
  await page.click('#kc-login');
  await page.waitForURL(url => !/\/kc-auth\/realms\/esquire/.test(url.href), { timeout: 15000 });
  await page.waitForTimeout(8000); // capture post-login activity

  console.log('=== EVENTS ===');
  for (const e of events) console.log(e);
});
