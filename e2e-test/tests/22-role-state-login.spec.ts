import { test, expect, request as pwRequest, Page } from '@playwright/test';
import { keycloakLogin, keycloakSignIn } from '../helpers/auth';
import { setupHouse, teardownHouse, House } from '../helpers/testHouse';
import { adminToken, waitForKcUser, setPassword, waitForKcUserGone, sleep, SYNC_TIMEOUT, POLL_MS } from '../helpers/kcAdmin';

// Three role settings, asserted the way the user meets them -- by signing in.
//   no role at all       -- REFUSED
//   an admin role only   -- REFUSED: no TREE, which the explorer routes ask for
//   TREE only            -- NOT an error: read-only, refused only on a change
// Pins the loop: a roleless token used to be rejected as invalid_token, which the browser read as an
// expired session and bounced to the login, forever. Both halves are asserted -- the message shown, and
// that the flow never lands on the session-expiry marker.

const KC = process.env['KC_URL'] || 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] || 'esquire';
//xxx: the stack's BFF runs on the pure OAuth client -- the gateway then names the account by its login id
const PURE_OAUTH = process.env['PURE_OAUTH'] === 'true';

// The role the explorer routes ask for, and the role family that carries admin permissions.
const TREE_ROLE = 'TREE';
const ADMIN_ROLE = 'SUPERVIZOR';

type Role = { id: string; kind: number; name: string };
type Profile = { loginId: string; connectFlg: string; roles: Role[]; rolesAll: Role[]; [k: string]: unknown };

async function kcRealmRoles(token: string, kcId: string): Promise<string[]> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${KC}/admin/realms/${REALM}/users/${kcId}/role-mappings/realm`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const roles = (await res.json()) as Array<{ name: string }>;
  await ctx.dispose();
  return (roles ?? []).map((r) => r.name);
}

async function waitForRoles(token: string, kcId: string, expected: string[]): Promise<void> {
  const deadline = Date.now() + SYNC_TIMEOUT;
  let held: string[] = [];
  while (Date.now() < deadline) {
    held = await kcRealmRoles(token, kcId);
    let matched = true;
    for (const name of expected) {
      if (!held.includes(name)) {
        matched = false;
      }
    }
    // The realm's own default role rides along on every user, so only the Esquire ones are compared.
    if (matched && !held.includes(TREE_ROLE) === !expected.includes(TREE_ROLE)
        && !held.includes(ADMIN_ROLE) === !expected.includes(ADMIN_ROLE)) {
      return;
    }
    await sleep(POLL_MS);
  }
  throw new Error(`KeyCloak roles did not settle to [${expected.join(', ')}] -- last seen [${held.join(', ')}]`);
}

test.describe.serial('a wrong role setting is refused by name, not reported as an expired session', () => {
  let house: House;
  let token: string;
  let kcId: string;
  let loginId: string;
  let password: string;

  // The roles the operator can grant, looked up once by name so the spec never hardcodes a role id.
  let treeRole: Role;
  let adminRole: Role;

  async function readProfile(page: Page, id: string): Promise<Profile> {
    const res = await page.request.get(`/api/esq-key?id=${id}`);
    expect(res.status(), 'the admin must be able to read the access profile').toBe(200);
    return (await res.json()) as Profile;
  }

  async function saveProfile(page: Page, id: string, changes: Record<string, unknown>): Promise<Profile> {
    const res = await page.request.post(`/api/esq-key-save?id=${id}`, {
      data: { ...(await readProfile(page, id)), ...changes },
    });
    expect(res.status(), `saving ${Object.keys(changes).join(', ')} must succeed`).toBe(200);
    return (await res.json()) as Profile;
  }

  function accountName(): string {
    let ret = house.merchantId;
    if (PURE_OAUTH) {
      ret = loginId;
    }
    return ret;
  }

  async function pageAsAdmin(browser: any): Promise<Page> {
    const page = await browser.newPage();
    await keycloakLogin(page);
    return page;
  }

  // Put the user into one role state and wait until KeyCloak agrees, so the next sign-in mints a token
  // that actually carries it.
  //xxx: the pure OAuth stack keeps the roles out of KeyCloak -- the save evicts the gateway's cached claims,
  // so there is nothing to wait for
  async function setRoles(browser: any, roles: Role[]): Promise<void> {
    const page = await pageAsAdmin(browser);
    await saveProfile(page, house.merchantId, { roles });
    await page.close();
    if (!PURE_OAUTH) {
      await waitForRoles(token, kcId, roles.map((r) => r.name));
    }
  }

  test.beforeAll(async ({ browser }) => {
    token = await adminToken();
    const stamp = Date.now();
    password = `E2eRole-${stamp}`;

    const page = await pageAsAdmin(browser);
    house = await setupHouse(page, `rolestate-${stamp}`);

    const profile = await readProfile(page, house.merchantId);
    loginId = profile.loginId;
    const tree = (profile.rolesAll ?? []).find((r) => r.name === TREE_ROLE);
    const admin = (profile.rolesAll ?? []).find((r) => r.name === ADMIN_ROLE);
    expect(tree, `the seed must offer the ${TREE_ROLE} role`).toBeTruthy();
    expect(admin, `the seed must offer the ${ADMIN_ROLE} role`).toBeTruthy();
    treeRole = tree as Role;
    adminRole = admin as Role;

    // Activate: keySmith publishes, kcMaster creates the KeyCloak account.
    await saveProfile(page, house.merchantId, { connectFlg: 'Y', roles: [] });
    await page.close();

    const found = await waitForKcUser(token, loginId);
    expect(found, `KeyCloak must hold ${loginId} after activation`).toBeTruthy();
    kcId = found as string;
    await setPassword(token, kcId, password);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await keycloakLogin(page);
    // The fixture CONNECTED this user, and a connected user refuses deletion (409, active auth
    // connection). teardownHouse swallows that, so without disconnecting first the user survives,
    // the office cannot go either, and the tree is left behind in every environment the suite runs in.
    await saveProfile(page, house.merchantId, { connectFlg: 'N', roles: [] });
    await waitForKcUserGone(token, loginId);
    await teardownHouse(page, house.officeId);
    await page.close();
  });

  // Sign in as the test user on a context of its own, collecting what the app said, where it went, and
  // the status its OWN /esq-key call came back with. That last one is why nothing here issues a second
  // request: on a refusal the app logs itself out, and a follow-up request would race that and read 401
  // from the dead session instead of the answer the app actually got.
  async function signInAsTestUser(browser: any): Promise<{
    visited: string[]; dialogs: string[]; keyStatus: Promise<number>; page: Page;
  }> {
    const context = await browser.newContext();
    const page = await context.newPage();
    const visited: string[] = [];
    const dialogs: string[] = [];
    page.on('framenavigated', (frame: any) => {
      if (frame === page.mainFrame()) {
        visited.push(frame.url());
      }
    });
    page.on('dialog', async (dialog: any) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    const keyStatus = page.waitForResponse(r => r.url().includes('/api/esq-key'), { timeout: 30000 })
      .then(r => r.status());
    await keycloakSignIn(page, loginId, password);
    return { visited, dialogs, keyStatus, page };
  }

  test('no role at all -- refused with a message naming the account, and never as an expired session',
    async ({ browser }) => {
      await setRoles(browser, []);
      const { visited, dialogs, keyStatus, page } = await signInAsTestUser(browser);

      expect(await keyStatus,
        'a roleless token is a permission answer (403), never a broken one (401)').toBe(403);

      await expect
        .poll(() => dialogs.join(' | '), { timeout: 15000, message: 'the user must be told, in words' })
        .toContain('no privileges');
      expect(dialogs.join(' | '), 'the refusal must name the account').toContain(accountName());
      expect(visited.join(' | '), 'a missing role must never be reported as an expired session')
        .not.toContain('auth=expired');
      await page.context().close();
    });

  test('an admin role but no TREE -- the same refusal, by the same sentence', async ({ browser }) => {
    await setRoles(browser, [adminRole]);
    const { dialogs, visited, keyStatus, page } = await signInAsTestUser(browser);

    expect(await keyStatus, 'admin rights do not open the explorer routes').toBe(403);

    await expect
      .poll(() => dialogs.join(' | '), { timeout: 15000, message: 'the user must be told, in words' })
      .toContain('no privileges');
    expect(dialogs.join(' | '), 'the refusal must name the account').toContain(accountName());
    expect(visited.join(' | '), 'a missing role must never be reported as an expired session')
      .not.toContain('auth=expired');
    await page.context().close();
  });

  test('TREE without an admin role -- signs in and reads, and is refused only on a change',
    async ({ browser }) => {
      await setRoles(browser, [treeRole]);
      const { page } = await signInAsTestUser(browser);

      await page.waitForSelector('.name-bar', { timeout: 30000 });
      const profile = await page.request.get('/api/esq-key');
      expect(profile.status(), 'TREE alone is a working read-only sign-in').toBe(200);

      const created = await page.request.post(
        `/api/esq-cmd-new?kind=20&parentId=${house.officeId}&cmd=new`,
        { data: { name: `role-state-${Date.now()}`, desc: 'must not be created' } },
      );
      expect(created.status(), 'no admin role means no change is permitted').toBe(403);
      await page.context().close();
    });
});
