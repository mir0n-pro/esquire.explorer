import { test, expect, Page } from '@playwright/test';
import { keycloakLogin, keycloakSignIn } from '../helpers/auth';
import { setupHouse, teardownHouse, House } from '../helpers/testHouse';
import { adminToken, waitForKcUser, setPassword, waitForKcUserGone } from '../helpers/kcAdmin';

// Three role settings, asserted the way the user meets them -- by signing in.
//   no role at all       -- REFUSED
//   an admin role only   -- REFUSED: no TREE, which the explorer routes ask for
//   TREE only            -- NOT an error: read-only, refused only on a change
// Pins the loop: a roleless token used to be rejected as invalid_token, which the browser read as an
// expired session and bounced to the login, forever. Both halves are asserted -- the message shown, and
// that the flow never lands on the session-expiry marker.

// The role the explorer routes ask for, and the role family that carries admin permissions.
const TREE_ROLE = 'TREE';
const ADMIN_ROLE = 'SUPERVIZOR';

type Role = { id: string; kind: number; name: string };
type Profile = { loginId: string; connectFlg: string; roles: Role[]; rolesAll: Role[]; [k: string]: unknown };

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

  //xxx: the roles stay out of KeyCloak -- the save evicts the gateway's cached claims, so the next sign-in
  // reads the new roles with nothing to wait for
  async function setRoles(browser: any, roles: Role[]): Promise<void> {
    const page = await pageAsAdmin(browser);
    await saveProfile(page, house.merchantId, { roles });
    await page.close();
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
      expect(dialogs.join(' | '), 'the refusal must name the account').toContain(loginId);
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
    expect(dialogs.join(' | '), 'the refusal must name the account').toContain(loginId);
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
