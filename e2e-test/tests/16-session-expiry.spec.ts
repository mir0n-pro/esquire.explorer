import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

// T-B session-resilience: an expired BFF session sends the user to the landing with a
// "session expired" notice (via the ?auth=expired marker) instead of a dead error.

test('the auth=expired marker shows the notice and strips the marker from the URL', async ({ page }) => {
  await page.goto('/?auth=expired');
  const notice = page.locator('.session-expired-notice');
  await expect(notice).toBeVisible({ timeout: 10000 });
  await expect(notice).toContainText(/session expired/i);
  // ngOnInit strips the marker so a manual reload does not keep showing it
  await expect.poll(() => new URL(page.url()).searchParams.has('auth'), { timeout: 5000 }).toBe(false);
});

test('a plain landing shows no session-expired notice', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.toolbar-login-hint', { timeout: 10000 });
  await expect(page.locator('.session-expired-notice')).toHaveCount(0);
});

test('a dead session on an API action bounces to the landing notice', async ({ page }) => {
  await keycloakLogin(page);
  await expect(page.locator('.name-bar')).toBeVisible();
  // Simulate a dead BFF session deterministically: every /api/* call returns
  // 401 {no session}, and /auth/me reports unauthenticated (so the post-redirect
  // bootstrap lands on the notice instead of re-bootstrapping into a loop).
  await page.route('**/api/**', route =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"no session"}' }));
  await page.route('**/auth/me', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"authenticated":false}' }));
  // A tree refresh fires an /api/* call -> 401 -> rfc9457Interceptor redirects to /?auth=expired
  await page.locator('button[matTooltip="Refresh"]').click();
  await expect(page.locator('.session-expired-notice')).toBeVisible({ timeout: 15000 });
});
