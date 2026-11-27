import { test, expect, Browser, Page } from '@playwright/test';
import { keycloakLogin, keycloakSignIn } from '../helpers/auth';
import { setupHouse, teardownHouse, House } from '../helpers/testHouse';
import { adminToken, waitForKcUser, waitForKcUserGone, setPassword } from '../helpers/kcAdmin';

// Every kind of user signs in through the BFF and works on the gateway's claims: the main admin of the seed,
// a merchant user and a client user. Each one reads its own access profile and its own tree.

const TREE_ROLE = 'TREE';

type Role = { id: string; kind: number; name: string };
type Profile = { id: string | number; loginId: string; connectFlg: string; roles: Role[]; rolesAll: Role[]; [k: string]: unknown };

interface TestUser {
  id: string;
  loginId: string;
  password: string;
}

test.describe.serial('every user kind signs in through the BFF', () => {
  let house: House;
  let token: string;
  let merchant: TestUser;
  let client: TestUser;

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

  async function connect(page: Page, id: string, password: string): Promise<TestUser> {
    const profile = await readProfile(page, id);
    let tree: Role | null = null;
    for (const r of profile.rolesAll ?? []) {
      if (r.name === TREE_ROLE) {
        tree = r;
      }
    }
    expect(tree, `the seed must offer the ${TREE_ROLE} role`).toBeTruthy();
    await saveProfile(page, id, { connectFlg: 'Y', roles: [tree as Role] });

    const kcId = await waitForKcUser(token, profile.loginId);
    expect(kcId, `Keycloak must hold ${profile.loginId} after activation`).toBeTruthy();
    await setPassword(token, kcId as string, password);
    const ret: TestUser = { id: id, loginId: profile.loginId, password: password };
    return ret;
  }

  async function disconnect(page: Page, user: TestUser | undefined): Promise<boolean> {
    let ret = true;
    if (user) {
      await saveProfile(page, user.id, { connectFlg: 'N', roles: [] });
      ret = await waitForKcUserGone(token, user.loginId);
    }
    return ret;
  }

  async function expectOwnWork(page: Page, loginId: string): Promise<void> {
    await page.waitForSelector('.name-bar', { timeout: 30000 });
    const own = await page.request.get('/api/esq-key');
    expect(own.status(), 'the own access profile through the BFF').toBe(200);
    expect(((await own.json()) as Profile).loginId, 'the profile of the signed-in user').toBe(loginId);
    await expect(page.locator('mat-tree-node').first(), 'the own tree loads').toBeVisible({ timeout: 15000 });
  }

  async function signInAs(browser: Browser, user: TestUser): Promise<Page> {
    const context = await browser.newContext();
    const ret = await context.newPage();
    await keycloakSignIn(ret, user.loginId, user.password);
    return ret;
  }

  test.beforeAll(async ({ browser }) => {
    token = await adminToken();
    const stamp = Date.now();

    const page = await browser.newPage();
    await keycloakLogin(page);
    house = await setupHouse(page, `kinds-${stamp}`);
    merchant = await connect(page, house.merchantId, `E2eMer-${stamp}`);
    client = await connect(page, house.clientId, `E2eCli-${stamp}`);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await keycloakLogin(page);
    //xxx: a connected user refuses deletion, so the teardown would leave the whole house behind
    const merchantGone = await disconnect(page, merchant);
    const clientGone = await disconnect(page, client);
    await teardownHouse(page, house.officeId);
    await page.close();
    expect(merchantGone, 'Keycloak must drop the merchant user after the disconnect').toBe(true);
    expect(clientGone, 'Keycloak must drop the client user after the disconnect').toBe(true);
  });

  test('the main admin', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await keycloakLogin(page);
    await expectOwnWork(page, process.env['E2E_USERNAME']!);
    await context.close();
  });

  test('a merchant user', async ({ browser }) => {
    const page = await signInAs(browser, merchant);
    await expectOwnWork(page, merchant.loginId);
    await page.context().close();
  });

  test('a client user', async ({ browser }) => {
    const page = await signInAs(browser, client);
    await expectOwnWork(page, client.loginId);
    await page.context().close();
  });
});
