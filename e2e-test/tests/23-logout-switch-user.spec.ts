import { test, expect } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

// Logging out has to end the KEYCLOAK session, not only the Esquire one. RP-initiated logout works
// only as a top-level navigation: driven through fetch, Keycloak never sees the browser first-party,
// its SSO cookies survive, and the next login returns the same user without asking -- so the user
// cannot be switched. A 302 on /auth/logout is the shape that fails; 200 with a URL to navigate to
// is the shape that works.
test('logout ends the Keycloak session, so the next login asks again', async ({ page }) => {
  await keycloakLogin(page);
  await expect(page.locator('.name-bar')).toBeVisible();

  const logoutResponse = page.waitForResponse(r => r.url().includes('/auth/logout'));
  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Log out")').click();
  expect((await logoutResponse).status(), '/auth/logout must answer, not redirect').toBe(200);

  await page.waitForSelector('.toolbar-login-hint', { timeout: 30000 });

  await page.locator('button[aria-label="Profile menu"]').click();
  await page.locator('button[mat-menu-item]:has-text("Log in")').click();
  await page.waitForURL(/\/kc-auth\/realms\/esquire/, { timeout: 30000 });
  await expect(page.locator('#username'),
    'Keycloak must ask again -- if it does not, its SSO cookies survived and the user cannot be switched')
    .toBeVisible({ timeout: 15000 });
});
