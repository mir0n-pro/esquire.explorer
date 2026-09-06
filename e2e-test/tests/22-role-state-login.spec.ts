import { test, expect, request as pwRequest, Page } from '@playwright/test';
import { keycloakLogin, keycloakSignIn } from '../helpers/auth';
import { setupHouse, teardownHouse, House } from '../helpers/testHouse';

// Three role settings, asserted the way the user meets them -- by signing in.
//   no role at all       -- REFUSED
//   an admin role only   -- REFUSED: no TREE, which the explorer routes ask for
//   TREE only            -- NOT an error: read-only, refused only on a change
// Pins the loop: a roleless token used to be rejected as invalid_token, which the browser read as an
// expired session and bounced to the login, forever. Both halves are asserted -- the message shown, and
// that the flow never lands on the session-expiry marker.

const KC = process.env['KC_URL'] || 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] || 'esquire';
const ADMIN_CLIENT = process.env['KC_ADMIN_CLIENT'] || 'esq-kcMaster';

// The role the explorer routes ask for, and the role family that carries admin permissions.
const TREE_ROLE = 'TREE';
const ADMIN_ROLE = 'SUPERVIZOR';

// keySmith publishes and kcMaster answers on the bus, so every wait for KeyCloak polls rather than sleeps.
const SYNC_TIMEOUT = 20000;
const POLL_MS = 500;

type Role = { id: string; kind: number; name: string };
type Profile = { loginId: string; connectFlg: string; roles: Role[]; rolesAll: Role[]; [k: string]: unknown };

// THE SECRET HAS NO FALLBACK, and the check is lazy on purpose -- both for the reasons spelled out in
// 21-credential-state-sync: a default authenticates against a rotated realm with a dead credential and blames
// Esquire for it, and a throw at module scope takes down suite COLLECTION, not just this file.
function adminSecret(): string {
  const ret = process.env['KC_ADMIN_SECRET'] || process.env['KCMASTER_ADMIN_SECRET'];
  if (!ret) {
    throw new Error(
      'KC_ADMIN_SECRET (or KCMASTER_ADMIN_SECRET) is not set. It is the esq-kcMaster (realm-admin) client ' +
      'secret, and this spec has no fallback for it on purpose.',
    );
  }
  return ret;
}

async function adminToken(): Promise<string> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${KC}/realms/${REALM}/protocol/openid-connect/token`, {
    form: { grant_type: 'client_credentials', client_id: ADMIN_CLIENT, client_secret: adminSecret() },
  });
  expect(res.status(), 'the admin client must be able to get a token').toBe(200);
  const token = ((await res.json()) as { access_token?: string }).access_token;
  await ctx.dispose();
  return token as string;
}

// The KeyCloak user id for a login, or null while KeyCloak does not hold the user yet.
async function kcUserId(token: string, loginId: string): Promise<string | null> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(
    `${KC}/admin/realms/${REALM}/users?username=${encodeURIComponent(loginId)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const users = (await res.json()) as Array<{ id: string }>;
  await ctx.dispose();
  return users && users.length > 0 ? users[0].id : null;
}

async function kcRealmRoles(token: string, kcId: string): Promise<string[]> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${KC}/admin/realms/${REALM}/users/${kcId}/role-mappings/realm`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const roles = (await res.json()) as Array<{ name: string }>;
  await ctx.dispose();
  return (roles ?? []).map((r) => r.name);
}

// Give the test user a password we know. Activation does set one -- kcMaster creates the account with a
// temporary password and UPDATE_PASSWORD standing -- so signing in with it would land on KeyCloak's
// change-password form, and the spec would be asserting that form instead of the role state. Setting a
// permanent one and clearing the required actions puts the sign-in back on the path under test.
async function setPassword(token: string, kcId: string, password: string): Promise<void> {
  const ctx = await pwRequest.newContext();
  const pwd = await ctx.put(`${KC}/admin/realms/${REALM}/users/${kcId}/reset-password`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { type: 'password', value: password, temporary: false },
  });
  expect(pwd.status(), 'the test password must be accepted').toBeLessThan(300);
  const cleared = await ctx.put(`${KC}/admin/realms/${REALM}/users/${kcId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { requiredActions: [] },
  });
  expect(cleared.status(), 'the required actions must be clearable').toBeLessThan(300);
  await ctx.dispose();
}

// kcMaster removes the KeyCloak account on disconnect; the entity delete may run before that lands.
async function waitForKcUserGone(token: string, loginId: string): Promise<void> {
  const deadline = Date.now() + SYNC_TIMEOUT;
  while (Date.now() < deadline) {
    if ((await kcUserId(token, loginId)) === null) {
      return;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
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
    await new Promise((r) => setTimeout(r, POLL_MS));
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

  async function pageAsAdmin(browser: any): Promise<Page> {
    const page = await browser.newPage();
    await keycloakLogin(page);
    return page;
  }

  // Put the user into one role state and wait until KeyCloak agrees, so the next sign-in mints a token
  // that actually carries it.
  async function setRoles(browser: any, roles: Role[]): Promise<void> {
    const page = await pageAsAdmin(browser);
    await saveProfile(page, house.merchantId, { roles });
    await page.close();
    await waitForRoles(token, kcId, roles.map((r) => r.name));
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

    const deadline = Date.now() + SYNC_TIMEOUT;
    let found: string | null = null;
    while (found === null && Date.now() < deadline) {
      found = await kcUserId(token, loginId);
      if (found === null) {
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    }
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
      expect(dialogs.join(' | '), 'the refusal must name the account').toContain(house.merchantId);
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
    expect(dialogs.join(' | '), 'the refusal must name the account').toContain(house.merchantId);
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
