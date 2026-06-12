import { test, expect, type Page } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';

// System entity flag (v1.2.8 #3): a DB-set-only flag marks foundational seed entities
// as protected from deletion. enyMan's ValidatorFactory.validateDelete() rejects a delete
// of any entity whose system flag = 'Y' with HTTP 409 (DeleteRestrictedException), ahead
// of the per-kind biz-validator chain.
//
// Exercises the full path: authenticated browser session -> BFF /api proxy (injects the
// bearer) -> gateway -> enyMan -> DB guard. Targets are the seed fixtures flagged 'Y' in
// db.seed/fill/initial-entities.sql (org 1, 14; users 4, 5, 15, 16, 17).
//
// Targets below are the ones that reach the guard cleanly. user 4 (System Administrator)
// is also protected but returns 403 first: the isAdminCmdPermitted() permission gate
// rejects the caller before the system-flag guard runs, so it is not a clean guard probe.
test.describe.serial('system entity flag — protected from deletion', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await keycloakLogin(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  const protectedTargets = [
    { label: 'root Esquire office (org 1)', kind: 20, id: '1' },
    { label: 'Test House office (org 14)', kind: 20, id: '14' },
    { label: 'Test Driver user (user 15)', kind: 32, id: '15' },
    { label: 'Test Driver S user (user 16)', kind: 32, id: '16' },
  ];

  for (const t of protectedTargets) {
    test(`delete of ${t.label} is blocked with 409`, async () => {
      const res = await page.request.post(`/api/esq-cmd-del?kind=${t.kind}&id=${t.id}`);
      expect(res.status(), `${t.label} must be delete-protected (system entity)`).toBe(409);
    });
  }
});
