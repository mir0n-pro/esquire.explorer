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

test('the session-expired notice does not push the login button out of the toolbar', async ({ page }) => {
  await page.goto('/?auth=expired');
  const notice = page.locator('.session-expired-notice');
  const loginBtn = page.locator('button.profile-menu-button');
  await expect(notice).toBeVisible({ timeout: 10000 });
  await expect(loginBtn).toBeVisible();
  // Regression guard: the notice used to steal the col-3 grid track and collide the
  // login trigger into col-4, overflowing it into a clipped 2nd toolbar row. toBeVisible
  // does NOT catch that (the element keeps a bounding box), so assert the button stays
  // inside the toolbar's single-row vertical band.
  const tb = await page.locator('mat-toolbar').first().boundingBox();
  const bb = await loginBtn.boundingBox();
  expect(tb).not.toBeNull();
  expect(bb).not.toBeNull();
  expect(bb!.y).toBeGreaterThanOrEqual(tb!.y - 1);
  expect(bb!.y + bb!.height).toBeLessThanOrEqual(tb!.y + tb!.height + 1);
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
