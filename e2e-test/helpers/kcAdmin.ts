import { expect, request as pwRequest } from '@playwright/test';

// Keycloak admin calls for the specs that sign in as a user of their own.

const KC = process.env['KC_URL'] || 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] || 'esquire';
const ADMIN_CLIENT = process.env['KC_ADMIN_CLIENT'] || 'esq-kcMaster';

export const SYNC_TIMEOUT = 20000;
export const POLL_MS = 500;

//xxx: no fallback for the secret, and the check is lazy -- a throw at module scope breaks suite collection
function adminSecret(): string {
  const ret = process.env['KC_ADMIN_SECRET'] || process.env['KCMASTER_ADMIN_SECRET'];
  if (!ret) {
    throw new Error(
      'KC_ADMIN_SECRET (or KCMASTER_ADMIN_SECRET) is not set. It is the esq-kcMaster (realm-admin) client ' +
      'secret, and this helper has no fallback for it on purpose.',
    );
  }
  return ret;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export async function adminToken(): Promise<string> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${KC}/realms/${REALM}/protocol/openid-connect/token`, {
    form: { grant_type: 'client_credentials', client_id: ADMIN_CLIENT, client_secret: adminSecret() },
  });
  expect(res.status(), 'the admin client must be able to get a token').toBe(200);
  const ret = ((await res.json()) as { access_token?: string }).access_token as string;
  await ctx.dispose();
  return ret;
}

// The Keycloak user id for a login, or null while Keycloak does not hold the user.
export async function kcUserId(token: string, loginId: string): Promise<string | null> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(
    `${KC}/admin/realms/${REALM}/users?username=${encodeURIComponent(loginId)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const users = (await res.json()) as Array<{ id: string }>;
  await ctx.dispose();
  let ret: string | null = null;
  if (users && users.length > 0) {
    ret = users[0].id;
  }
  return ret;
}

async function kcHasPassword(token: string, kcId: string): Promise<boolean> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${KC}/admin/realms/${REALM}/users/${kcId}/credentials`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let ret = false;
  if (res.status() === 200) {
    const credentials = (await res.json()) as Array<{ type: string }>;
    for (const c of credentials) {
      if (c.type === 'password') {
        ret = true;
      }
    }
  }
  await ctx.dispose();
  return ret;
}

//xxx: kcMaster creates the user and sets its temporary password in two calls -- a password set in between
// is overwritten, so the user counts as there only once it has a password
export async function waitForKcUser(token: string, loginId: string): Promise<string | null> {
  const deadline = Date.now() + SYNC_TIMEOUT;
  let ret: string | null = null;
  while (ret === null && Date.now() < deadline) {
    const kcId = await kcUserId(token, loginId);
    if (kcId !== null && await kcHasPassword(token, kcId)) {
      ret = kcId;
    }
    if (ret === null) {
      await sleep(POLL_MS);
    }
  }
  return ret;
}

export async function waitForKcUserGone(token: string, loginId: string): Promise<boolean> {
  const deadline = Date.now() + SYNC_TIMEOUT;
  let ret = false;
  while (!ret && Date.now() < deadline) {
    ret = (await kcUserId(token, loginId)) === null;
    if (!ret) {
      await sleep(POLL_MS);
    }
  }
  return ret;
}

//xxx: activation leaves a temporary password with UPDATE_PASSWORD standing -- the sign-in would land on the
// change-password form, so a permanent password is set and the required actions cleared
export async function setPassword(token: string, kcId: string, password: string): Promise<void> {
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
