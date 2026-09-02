import { test, expect, request as pwRequest } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { setupHouse, teardownHouse, House } from '../helpers/testHouse';

// The credential-state routines, asserted where they actually land: KeyCloak's required actions.
//
// Esquire never changes a password or configures TOTP itself. It records the REQUEST -- au_force_change_flg,
// au_tfa_method -- and keySmith syncs it to KeyCloak as a required action, which KeyCloak then puts in front of
// the user at the next login. So the whole routine is: does the request reach KeyCloak, and does WITHDRAWING it
// take it back off again.
//
// The flag is the answer in both directions: raised, KeyCloak asks; lowered, KeyCloak stops asking. esq2025
// owns the two actions Esquire drives, the same way it owns the realm role mapping.
//
// The taking-back is the half that had no coverage and no implementation. tfaMethod g -> n (TOTP requested,
// user never logged in to set it up, then cancelled) removed an otp credential that was never created and left
// CONFIGURE_TOTP standing: the database said TOTP was off and KeyCloak still forced the setup. Nothing in the
// suite could see it, because nothing here had ever read a required action.
//
// Asserted through KeyCloak's admin API -- the state lives there, not in any Esquire response. The host, realm
// and client id are the dev values from the committed realm import (keycloak/import/esquire.json), overridable
// via env, the same arrangement 20-token-relay uses.

const KC = process.env['KC_URL'] || 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] || 'esquire';
const ADMIN_CLIENT = process.env['KC_ADMIN_CLIENT'] || 'esq-kcMaster';

// THE SECRET IS THE ONE THING WITH NO FALLBACK, and it is the same rule every deploy script now carries.
// esq-kcMaster is the only published client holding realm-management realm-admin, so its secret is the realm's
// master key rather than one credential among seven. It used to default to the committed value, which is right
// against the docker realm and wrong the moment a public realm is rotated: the suite would authenticate with a
// dead credential and fail on an assertion, blaming Esquire for a secret that was never supplied.
//
// Failing here instead names the actual cause. Either name is accepted: KC_ADMIN_SECRET is what CI passes,
// KCMASTER_ADMIN_SECRET is what the deploy scripts already read from the environment, and they are one value.
//
// THE CHECK IS LAZY, AND THAT MATTERS. A throw at module scope runs when Playwright COLLECTS the suite, not
// when this spec runs -- so it takes down `playwright test --list` and every other spec with it
// ("Total: 0 tests in 0 files"). Reading it where it is used fails only the tests that need it.
function adminSecret(): string {
  const ret = process.env['KC_ADMIN_SECRET'] || process.env['KCMASTER_ADMIN_SECRET'];
  if (!ret) {
    throw new Error(
      'KC_ADMIN_SECRET (or KCMASTER_ADMIN_SECRET) is not set. It is the esq-kcMaster (realm-admin) client ' +
      'secret, and this spec has no fallback for it on purpose -- a default would pass against the docker ' +
      'realm and authenticate with a dead credential against a rotated one.',
    );
  }
  return ret;
}

// The sync is asynchronous -- keySmith publishes a URQ and kcMaster answers on the bus -- so every assertion
// polls rather than sleeps.
const SYNC_TIMEOUT = 15000;

type Profile = { loginId: string; connectFlg: string; [k: string]: unknown };

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

// The user's required actions, or null when KeyCloak does not hold the user at all.
async function requiredActions(token: string, loginId: string): Promise<string[] | null> {
  const ctx = await pwRequest.newContext();
  const found = await ctx.get(
    `${KC}/admin/realms/${REALM}/users?username=${encodeURIComponent(loginId)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const users = (await found.json()) as Array<{ requiredActions?: string[] }>;
  await ctx.dispose();
  if (!users || users.length === 0) {
    return null;
  }
  return users[0].requiredActions ?? [];
}

test.describe.serial('credential-state requests reach KeyCloak, and withdrawing them takes them back', () => {
  let house: House;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    token = await adminToken();
    const page = await browser.newPage();
    await keycloakLogin(page);
    house = await setupHouse(page, `credstate-${Date.now()}`);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await keycloakLogin(page);
    await teardownHouse(page, house.officeId);
    await page.close();
  });

  test('force password change and TOTP: requested, then withdrawn', async ({ page }) => {
    await keycloakLogin(page);
    const id = house.merchantId;

    const read = async (): Promise<Profile> => {
      const res = await page.request.get(`/api/esq-key?id=${id}`);
      expect(res.status(), 'the access profile must be readable').toBe(200);
      return (await res.json()) as Profile;
    };
    // Round-trip the whole field map on every save, so only the field under test changes.
    const save = async (changes: Record<string, unknown>): Promise<Profile> => {
      const res = await page.request.post(`/api/esq-key-save?id=${id}`, {
        data: { ...(await read()), ...changes },
      });
      expect(res.status(), `saving ${JSON.stringify(changes)} must succeed`).toBe(200);
      return (await res.json()) as Profile;
    };

    // ---- the identity has to exist before a required action can stand on it ----------------------------
    const connected = await save({ connectFlg: 'Y' });
    expect(connected.connectFlg).toBe('Y');
    const loginId = connected.loginId;

    await expect
      .poll(async () => requiredActions(token, loginId), { timeout: SYNC_TIMEOUT })
      .not.toBeNull();

    // ---- force a password change -> KeyCloak holds UPDATE_PASSWORD ------------------------------------
    await save({ pwdChangeForced: 'Y' });
    await expect
      .poll(async () => requiredActions(token, loginId), { timeout: SYNC_TIMEOUT })
      .toContain('UPDATE_PASSWORD');

    // ---- let the user off again -> KeyCloak must stop asking -------------------------------------------
    await save({ pwdChangeForced: 'N' });
    await expect
      .poll(async () => requiredActions(token, loginId), { timeout: SYNC_TIMEOUT })
      .not.toContain('UPDATE_PASSWORD');

    // ---- request TOTP -> KeyCloak holds CONFIGURE_TOTP -------------------------------------------------
    await save({ tfaMethod: 'G' });
    await expect
      .poll(async () => requiredActions(token, loginId), { timeout: SYNC_TIMEOUT })
      .toContain('CONFIGURE_TOTP');

    // ---- withdraw it BEFORE the user ever sets it up ---------------------------------------------------
    // The narrow window that was broken: no otp credential exists yet, so removing credentials removes
    // nothing, and the pending request has to be taken off the user explicitly.
    await save({ tfaMethod: 'N' });
    await expect
      .poll(async () => requiredActions(token, loginId), { timeout: SYNC_TIMEOUT })
      .not.toContain('CONFIGURE_TOTP');

    // ---- leave the identity as the suite found it ------------------------------------------------------
    const disconnected = await save({ connectFlg: 'N' });
    expect(disconnected.connectFlg).toBe('N');
    await expect
      .poll(async () => requiredActions(token, loginId), { timeout: SYNC_TIMEOUT })
      .toBeNull();
  });
});
