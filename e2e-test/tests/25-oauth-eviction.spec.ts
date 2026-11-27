import { test, expect, Browser, Page } from '@playwright/test';
import { keycloakLogin, keycloakSignIn } from '../helpers/auth';
import { setupHouse, createOffice, teardownHouse, House } from '../helpers/testHouse';
import { adminToken, waitForKcUser, waitForKcUserGone, setPassword, sleep, POLL_MS } from '../helpers/kcAdmin';

// The gateway keeps a user's claims in its cache, and two events remove them:
//   keySmith -- the access profile was saved (roles)
//   enyMan   -- the user was moved (root path)
// Each test changes the claims of a user who stays signed in, and the user's next calls must see it.

const TREE_ROLE = 'TREE';
const USR_MERCHANT = 36;
const ORG = 20;
const EVICT_TIMEOUT = 15000;

type Role = { id: string; kind: number; name: string };
type Profile = { loginId: string; connectFlg: string; roles: Role[]; rolesAll: Role[]; [k: string]: unknown };

test.describe.serial('a claims change reaches a signed-in user at once', () => {
  let house: House;
  let otherOffice: { id: string; name: string };
  let token: string;
  let loginId: string;
  let password: string;
  let treeRole: Role;

  async function readProfile(page: Page, id: string): Promise<Profile> {
    const res = await page.request.get(`/api/esq-key?id=${id}`);
    expect(res.status(), 'the admin must be able to read the access profile').toBe(200);
    return (await res.json()) as Profile;
  }

  async function saveProfile(page: Page, id: string, changes: Record<string, unknown>): Promise<void> {
    const res = await page.request.post(`/api/esq-key-save?id=${id}`, {
      data: { ...(await readProfile(page, id)), ...changes },
    });
    expect(res.status(), `saving ${Object.keys(changes).join(', ')} must succeed`).toBe(200);
  }

  async function pageAsAdmin(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    await keycloakLogin(page);
    return page;
  }

  async function pageAsTestUser(browser: Browser): Promise<Page> {
    const context = await browser.newContext();
    const page = await context.newPage();
    await keycloakSignIn(page, loginId, password);
    await page.waitForSelector('.name-bar', { timeout: 30000 });
    return page;
  }

  async function ownProfileStatus(page: Page): Promise<number> {
    const res = await page.request.get('/api/esq-key');
    return res.status();
  }

  //xxx: the gateway keeps an entry while it is asked for, so this poll never lets it go idle -- only the
  // eviction event can change the answer
  async function pollOwnProfile(page: Page, expected: number): Promise<number> {
    const deadline = Date.now() + EVICT_TIMEOUT;
    let ret = await ownProfileStatus(page);
    while (ret !== expected && Date.now() < deadline) {
      await sleep(POLL_MS);
      ret = await ownProfileStatus(page);
    }
    return ret;
  }

  async function isUnder(page: Page, officeId: string, entityId: string): Promise<boolean> {
    const res = await page.request.get(`/api/esq-cmd-tree?kind=${ORG}&id=${officeId}`);
    let ret = false;
    if (res.status() === 200) {
      const nodes = (await res.json()) as Array<{ id: string | number; kind: number }>;
      for (const n of nodes) {
        if (String(n.id) === entityId && n.kind === USR_MERCHANT) {
          ret = true;
        }
      }
    }
    return ret;
  }

  async function waitUntilUnder(page: Page, officeId: string, entityId: string): Promise<boolean> {
    const deadline = Date.now() + EVICT_TIMEOUT;
    let ret = await isUnder(page, officeId, entityId);
    while (!ret && Date.now() < deadline) {
      await sleep(POLL_MS);
      ret = await isUnder(page, officeId, entityId);
    }
    return ret;
  }

  test.beforeAll(async ({ browser }) => {
    token = await adminToken();
    const stamp = Date.now();
    password = `E2eEvict-${stamp}`;

    const page = await pageAsAdmin(browser);
    house = await setupHouse(page, `evict-${stamp}`);
    otherOffice = await createOffice(page, `e2e-evict-dst-${stamp}`);

    const profile = await readProfile(page, house.merchantId);
    loginId = profile.loginId;
    let tree: Role | null = null;
    for (const r of profile.rolesAll ?? []) {
      if (r.name === TREE_ROLE) {
        tree = r;
      }
    }
    expect(tree, `the seed must offer the ${TREE_ROLE} role`).toBeTruthy();
    treeRole = tree as Role;

    await saveProfile(page, house.merchantId, { connectFlg: 'Y', roles: [treeRole] });
    await page.close();

    const kcId = await waitForKcUser(token, loginId);
    expect(kcId, `Keycloak must hold ${loginId} after activation`).toBeTruthy();
    await setPassword(token, kcId as string, password);
  });

  //xxx: runs after a failed beforeAll too, so it removes only what beforeAll got to make
  test.afterAll(async ({ browser }) => {
    let gone = true;
    if (house) {
      const page = await pageAsAdmin(browser);
      if (loginId) {
        //xxx: a connected user refuses deletion, so the teardown would leave the whole house behind
        await saveProfile(page, house.merchantId, { connectFlg: 'N', roles: [] });
        gone = await waitForKcUserGone(token, loginId);
      }
      await teardownHouse(page, house.officeId);
      if (otherOffice) {
        await teardownHouse(page, otherOffice.id);
      }
      await page.close();
    }
    expect(gone, `Keycloak must drop ${loginId} after the disconnect`).toBe(true);
  });

  test('an access profile save evicts the roles -- taken away and given back', async ({ browser }) => {
    const user = await pageAsTestUser(browser);
    expect(await ownProfileStatus(user), 'TREE reads the own profile').toBe(200);

    const admin = await pageAsAdmin(browser);
    await saveProfile(admin, house.merchantId, { roles: [] });
    expect(await pollOwnProfile(user, 403), 'without TREE the next calls are refused').toBe(403);

    await saveProfile(admin, house.merchantId, { roles: [treeRole] });
    expect(await pollOwnProfile(user, 200), 'TREE given back opens the reads again').toBe(200);

    await admin.close();
    await user.context().close();
  });

  test('a move evicts the root path -- the profile is found under the new office', async ({ browser }) => {
    const user = await pageAsTestUser(browser);
    expect(await ownProfileStatus(user), 'the own profile is read under the first office').toBe(200);

    const admin = await pageAsAdmin(browser);
    const moved = await admin.request.post(
      `/api/esq-move?kind=${USR_MERCHANT}&id=${house.merchantId}&dist_id=${otherOffice.id}`,
    );
    expect(moved.status(), 'the move is accepted').toBe(202);
    expect(await waitUntilUnder(admin, otherOffice.id, house.merchantId), 'the move must land').toBe(true);

    //xxx: with the old root path cached the own profile is not found (404) -- only the event clears it
    expect(await pollOwnProfile(user, 200), 'the own profile is read under the new office').toBe(200);

    await admin.close();
    await user.context().close();
  });
});
