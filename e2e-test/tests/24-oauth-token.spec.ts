import { test, expect, Page, Browser, BrowserContext, request as pwRequest } from '@playwright/test';
import { createHash, randomBytes } from 'crypto';

// The OAuth handshake of the BFF's client, run by hand: the token carries the login only, and the gateway
// takes the user's claims from keySmith.

const KC = process.env['KC_URL'] || 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] || 'esquire';
const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';
//xxx: the origin drops a default port (e2e-oci.bat names :443), which Keycloak's redirect match would refuse
const REDIRECT_URI = process.env['KC_REDIRECT_URI'] || `${new URL(BASE_URL).origin}/auth/callback`;
const SCOPE = 'openid profile email';
const GATEWAY = process.env['GATEWAY_URL'] || 'http://localhost:7070';

const CLIENT_ID = process.env['KC_CLIENT_ID'] || 'esq-angular';
const CLIENT_SECRET = process.env['KC_CLIENT_SECRET'] || 'esq-angular-bff-dev-secret-rotate-in-prod';

const AUTH_ENDPOINT = `${KC}/realms/${REALM}/protocol/openid-connect/auth`;
const TOKEN_ENDPOINT = `${KC}/realms/${REALM}/protocol/openid-connect/token`;

interface Handshake {
  accessToken: string;
  accessClaims: Record<string, unknown>;
  idClaims: Record<string, unknown>;
}

function base64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodePayload(jwt: string): Record<string, unknown> {
  const part = jwt.split('.')[1];
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
}

function authorizeUrl(challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

async function exchangeCode(code: string, verifier: string): Promise<Record<string, string>> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(TOKEN_ENDPOINT, {
    form: {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    },
  });
  expect(res.status(), `token exchange for ${CLIENT_ID}`).toBe(200);
  const ret = (await res.json()) as Record<string, string>;
  await ctx.dispose();
  return ret;
}

async function handshake(page: Page): Promise<Handshake> {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  const state = base64Url(randomBytes(16));

  //xxx: the callback is answered here, so the code is never spent by the BFF behind the redirect URI
  const callback = page.waitForRequest(req => req.url().startsWith(REDIRECT_URI), { timeout: 30000 });
  await page.goto(authorizeUrl(challenge, state));
  //xxx: with a KC SSO session the authorize redirects at once and there is no form
  if (!page.url().startsWith(REDIRECT_URI)) {
    await page.fill('#username', process.env['E2E_USERNAME']!);
    await page.fill('#password', process.env['E2E_PASSWORD']!);
    await page.click('#kc-login');
  }
  const back = new URL((await callback).url());
  expect(back.searchParams.get('state'), 'state round-trip').toBe(state);
  const code = back.searchParams.get('code');
  expect(code, `authorization code for ${CLIENT_ID}`).toBeTruthy();

  const tokens = await exchangeCode(code!, verifier);
  const ret: Handshake = {
    accessToken: tokens['access_token'],
    accessClaims: decodePayload(tokens['access_token']),
    idClaims: decodePayload(tokens['id_token']),
  };
  return ret;
}

async function newCallbackContext(browser: Browser): Promise<BrowserContext> {
  const ret = await browser.newContext();
  await ret.route(`${REDIRECT_URI}**`, route => route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' }));
  return ret;
}

async function gatewayKey(token: string, headers: Record<string, string>): Promise<{ status: number; body: Record<string, unknown> }> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${GATEWAY}/esq-key`, { headers: { ...headers, Authorization: `Bearer ${token}` } });
  const status = res.status();
  let body: Record<string, unknown> = {};
  if (status === 200) {
    body = (await res.json()) as Record<string, unknown>;
  }
  await ctx.dispose();
  const ret = { status: status, body: body };
  return ret;
}

test.describe('OAuth: the token carries the login only', () => {

  test('the access token and the ID token carry no Esquire claims', async ({ browser }) => {
    const ctx = await newCallbackContext(browser);
    const result = await handshake(await ctx.newPage());

    expect(result.accessClaims['sub'], 'sub').toBeTruthy();
    expect(result.accessClaims['preferred_username'], 'preferred_username').toBe(process.env['E2E_USERNAME']);
    expect(result.accessClaims['azp'], 'azp').toBe(CLIENT_ID);
    expect(result.accessClaims['esq_uid'], 'no esq_uid').toBeUndefined();
    expect(result.accessClaims['esq_rootpath'], 'no esq_rootpath').toBeUndefined();
    expect(result.accessClaims['realm_access'], 'no realm_access').toBeUndefined();
    expect(result.accessClaims['resource_access'], 'no resource_access').toBeUndefined();
    expect(result.idClaims['esq_uid'], 'no esq_uid in the ID token').toBeUndefined();
    expect(result.idClaims['realm_access'], 'no realm_access in the ID token').toBeUndefined();
    await ctx.close();
  });
});

test.describe('through the gateway: the claims come from keySmith', () => {

  test('the token reads the own access profile of the signed-in user', async ({ browser }) => {
    const ctx = await newCallbackContext(browser);
    const result = await handshake(await ctx.newPage());

    const own = await gatewayKey(result.accessToken, {});

    expect(own.status, 'the token through the gateway').toBe(200);
    expect(own.body['id'], 'the user id').toBeTruthy();
    expect(own.body['loginId'], 'login id').toBe(process.env['E2E_USERNAME']);
    await ctx.close();
  });

  test('forged claim headers are replaced by the gateway', async ({ browser }) => {
    const ctx = await newCallbackContext(browser);
    const result = await handshake(await ctx.newPage());
    const honest = await gatewayKey(result.accessToken, {});

    const forged = await gatewayKey(result.accessToken, { 'X-Esq-UID': '6', 'X-Esq-Root-Path': '1.', 'X-Esq-Roles': 'SYSADMIN,TREE' });

    expect(forged.status).toBe(200);
    expect(forged.body['id'], 'the forged uid is not used').toBe(honest.body['id']);
    await ctx.close();
  });
});
