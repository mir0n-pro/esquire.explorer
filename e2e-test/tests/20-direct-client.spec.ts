import { test, expect, request as pwRequest } from '@playwright/test';

// A direct client: a service that calls the gateway itself, with no BFF in between. It takes its own token
// from Keycloak (client_credentials), and the gateway takes its claims from keySmith by the token's login id.
// esq-hauberk is that client -- the load harness; its login id names the seeded access profile 15.
//
// URLs default to the docker stack; e2e-k8s.bat and e2e-oci.bat override GATEWAY_URL / KC_URL. The secret is
// the dev value from the committed realm import (keycloak/import/esquire.json), overridable via env.

const GATEWAY = process.env['GATEWAY_URL'] || 'http://localhost:7070';
const KC = process.env['KC_URL'] || 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] || 'esquire';

const CLIENT_ID = process.env['DIRECT_CLIENT_ID'] || 'esq-hauberk';
const CLIENT_SECRET = process.env['DIRECT_CLIENT_SECRET'] || 'esq-hauberk-dev-secret-rotate-in-prod';
const LOGIN_ID = process.env['DIRECT_CLIENT_LOGIN'] || 'esq-hauberk@mir0n.pro';

const TOKEN_ENDPOINT = `${KC}/realms/${REALM}/protocol/openid-connect/token`;

async function clientToken(): Promise<string> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(TOKEN_ENDPOINT, {
    form: { grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
  });
  expect(res.status(), `Keycloak issues a token for ${CLIENT_ID}`).toBe(200);
  const ret = ((await res.json()) as { access_token: string }).access_token;
  await ctx.dispose();
  return ret;
}

async function gatewayGet(path: string, token: string, headers: Record<string, string>): Promise<{ status: number; body: Record<string, unknown> }> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${GATEWAY}${path}`, { headers: { ...headers, Authorization: `Bearer ${token}` } });
  const status = res.status();
  let body: Record<string, unknown> = {};
  if (status === 200 && path.startsWith('/esq-key')) {
    body = (await res.json()) as Record<string, unknown>;
  }
  await ctx.dispose();
  const ret = { status: status, body: body };
  return ret;
}

test.describe('a direct client: its own token, straight to the gateway', () => {

  test('the client token carries the login only', async () => {
    const token = await clientToken();
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as Record<string, unknown>;

    expect(claims['azp'], 'azp').toBe(CLIENT_ID);
    expect(claims['preferred_username'], 'preferred_username').toBeTruthy();
    expect(claims['esq_uid'], 'no esq_uid').toBeUndefined();
    expect(claims['esq_rootpath'], 'no esq_rootpath').toBeUndefined();
    expect(claims['realm_access'], 'no realm_access').toBeUndefined();
  });

  test('the client reads its own access profile', async () => {
    const own = await gatewayGet('/esq-key', await clientToken(), {});

    expect(own.status, 'the client token through the gateway').toBe(200);
    expect(own.body['loginId'], 'the access profile of the client').toBe(LOGIN_ID);
  });

  test('the client reaches a protected read', async () => {
    const read = await gatewayGet('/esq-dict?kind=1000', await clientToken(), {});

    expect(read.status, 'a protected read with the client token').toBe(200);
  });

  test('forged claim headers are replaced by the gateway', async () => {
    const token = await clientToken();
    const honest = await gatewayGet('/esq-key', token, {});

    const forged = await gatewayGet('/esq-key', token, { 'X-Esq-UID': '6', 'X-Esq-Root-Path': '1.', 'X-Esq-Roles': 'SYSADMIN,TREE' });

    expect(forged.status).toBe(200);
    expect(forged.body['id'], 'the forged uid is not used').toBe(honest.body['id']);
  });

  test('no token is refused at the edge', async () => {
    const ctx = await pwRequest.newContext();
    const res = await ctx.get(`${GATEWAY}/esq-key`);

    expect(res.status(), 'a call with no token').toBe(401);
    await ctx.dispose();
  });
});
