import { test, expect, type APIResponse } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { setupHouse, teardownHouse, House } from '../helpers/testHouse';

// Access-profile save -> Keycloak identity sync: CONNECT -> UPDATE ROLE -> DISCONNECT.
//
// THE GAP THIS FILLS. Spec 03 only OPENS and CLOSES the Access Profile dialog -- it never saves. So the main
// suite never once drove the identity path, and NOTHING anywhere drove a ROLE change. A role that Esquire
// revoked but Keycloak kept is an AUTHORIZATION drift: the user keeps a permission the system believes it took
// away, and every test we had would still be green.
//
// THE CHAIN, end to end, for real:
//   browser session -> BFF /api proxy (injects the bearer) -> gateway -> keySmith
//   keySmith saves the access profile and PUBLISHES a URQ on the kc R&R bus
//   kcMaster consumes it and calls the Keycloak admin API
//
// WHY THIS ORDER, and not any other. au_connect_flg='Y' means an interactive-login user -- one that HAS a
// Keycloak account. So:
//   1. CONNECT      -> Keycloak CREATES the identity.
//   2. UPDATE ROLE  -> Keycloak re-assigns its roles. This only works on an identity that EXISTS: kcMaster looks
//                      the user up by username and throws if it is absent. Rolling the role change before the
//                      connect would fail the sync -- so the order here is not cosmetic, it is the contract.
//   3. DISCONNECT   -> Keycloak REMOVES the identity, leaving it as we found it.
// Both directions of the connect are driven on purpose: a create that works and a delete that silently does not
// is exactly the drift that leaves Esquire and Keycloak disagreeing about who exists.
//
// Self-contained: builds its own subtree under Test House and tears it down, so it never touches seed identities.
// (The cycle suite already drives connect/disconnect via guiConnect, but it ASSERTS nothing and never touches
// roles -- it is an activity generator. This is the assertion.)

type Role = { id: string; kind: number; name: string };
type Profile = {
  loginId: string;
  connectFlg: string;
  roles: Role[];
  rolesAll: Role[];
  [k: string]: unknown;
};

async function readProfile(request: APIResponse extends never ? never : any, id: string): Promise<Profile> {
  const res = await request.get(`/api/esq-key?id=${id}`);
  expect(res.status(), 'the access profile must be readable').toBe(200);
  return (await res.json()) as Profile;
}

test.describe.serial('access profile save drives the Keycloak identity sync', () => {
  let house: House;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await keycloakLogin(page);
    house = await setupHouse(page, `kcsync-${Date.now()}`);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await keycloakLogin(page);
    await teardownHouse(page, house.officeId);
    await page.close();
  });

  test('connect -> update role -> disconnect round-trips the identity through Keycloak', async ({ page }) => {
    await keycloakLogin(page);
    const id = house.merchantId;

    // Round-trip the WHOLE field map on every save, so the only thing that changes is the field under test --
    // not some field the test forgot to send.
    const before = await readProfile(page.request, id);

    // ---- 1. CONNECT: Keycloak creates the identity --------------------------------------------------------
    const connected = await page.request.post(`/api/esq-key-save?id=${id}`, {
      data: { ...before, connectFlg: 'Y' },
    });
    expect(connected.status(), 'saving with connect=Y must succeed').toBe(200);
    expect(((await connected.json()) as Profile).connectFlg).toBe('Y');

    // The sync is ASYNCHRONOUS -- keySmith publishes a URQ, kcMaster answers on the bus. Give the round-trip
    // room to land, or the role update below can overtake the create it depends on.
    await page.waitForTimeout(2000);

    // ---- 2. UPDATE ROLE: Keycloak re-assigns the user's roles ----------------------------------------------
    const profile = await readProfile(page.request, id);
    const assigned = new Set((profile.roles ?? []).map((r) => r.name));
    const toAdd = (profile.rolesAll ?? []).find((r) => !assigned.has(r.name));
    expect(toAdd, 'the seed must offer at least one role this user does not already hold').toBeTruthy();

    const newRoles: Role[] = [...(profile.roles ?? []), toAdd as Role];
    const roleSaved = await page.request.post(`/api/esq-key-save?id=${id}`, {
      data: { ...profile, roles: newRoles },
    });
    expect(roleSaved.status(), 'saving a changed role set must succeed').toBe(200);

    const after = (await roleSaved.json()) as Profile;
    expect(
      (after.roles ?? []).map((r) => r.name).sort(),
      'the granted role must come back on the saved profile -- if it does not, Esquire and Keycloak have already diverged',
    ).toEqual(newRoles.map((r) => r.name).sort());

    await page.waitForTimeout(2000);

    // ---- 3. DISCONNECT: Keycloak removes the identity again -------------------------------------------------
    const disconnected = await page.request.post(`/api/esq-key-save?id=${id}`, {
      data: { ...after, connectFlg: 'N' },
    });
    expect(disconnected.status(), 'saving with connect=N must succeed').toBe(200);
    expect(((await disconnected.json()) as Profile).connectFlg).toBe('N');

    await page.waitForTimeout(2000);
  });
});
