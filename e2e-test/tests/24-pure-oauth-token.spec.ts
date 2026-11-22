import { test, expect, Browser, BrowserContext, Page, TestInfo, request as pwRequest } from '@playwright/test';
import { createHash, randomBytes } from 'crypto';
import { sleep } from '../helpers/kcAdmin';

const KC = process.env['KC_URL'] || 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] || 'esquire';
const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';
const REDIRECT_URI = process.env['KC_REDIRECT_URI'] || `${BASE_URL}/auth/callback`;
const SCOPE = 'openid profile email';
const RUNS = Number(process.env['HANDSHAKE_RUNS'] || '5');
const GATEWAY = process.env['GATEWAY_URL'] || 'http://localhost:7070';
const API_CALLS = 10;
const MEASURE = process.env['MEASURE'] === 'true';
//xxx: the stack must run with ESQ_GW_PURE_OAUTH_CACHE_IDLE_MS = GW_IDLE_MS (its default is 60000),
// or a measured cold call is a cache hit
const GW_IDLE_MS = Number(process.env['GW_IDLE_MS'] || '2000');
const KC_ADMIN_USER = process.env['KC_ADMIN_USER'] || 'admin';
const KC_ADMIN_PASSWORD = process.env['KC_ADMIN_PASSWORD'] || 'q';

const CLAIMS_CLIENT = process.env['KC_CLIENT_ID'] || 'esq-angular';
const CLAIMS_SECRET = process.env['KC_CLIENT_SECRET'] || 'esq-angular-bff-dev-secret-rotate-in-prod';
const PURE_CLIENT = process.env['KC_PURE_CLIENT_ID'] || 'esq-angular-pure-oauth';
const PURE_SECRET = process.env['KC_PURE_CLIENT_SECRET'] || 'esq-angular-pure-oauth-dev-secret-rotate-in-prod';

//xxx: a target with no pure OAuth client (OKE runs the claims mode only) sets PURE_OAUTH_DISABLED=true
test.skip(process.env['PURE_OAUTH_DISABLED'] === 'true', 'no pure OAuth client on this target');

const AUTH_ENDPOINT = `${KC}/realms/${REALM}/protocol/openid-connect/auth`;
const TOKEN_ENDPOINT = `${KC}/realms/${REALM}/protocol/openid-connect/token`;

interface KcClient {
  id: string;
  secret: string;
}

interface Handshake {
  accessToken: string;
  accessClaims: Record<string, unknown>;
  idClaims: Record<string, unknown>;
  accessTokenBytes: number;
  ms: number;
}

const CLAIMS: KcClient = { id: CLAIMS_CLIENT, secret: CLAIMS_SECRET };
const PURE: KcClient = { id: PURE_CLIENT, secret: PURE_SECRET };

function base64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodePayload(jwt: string): Record<string, unknown> {
  const part = jwt.split('.')[1];
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
}

function authorizeUrl(client: KcClient, challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: client.id,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

async function exchangeCode(client: KcClient, code: string, verifier: string): Promise<Record<string, string>> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(TOKEN_ENDPOINT, {
    form: {
      grant_type: 'authorization_code',
      client_id: client.id,
      client_secret: client.secret,
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    },
  });
  expect(res.status(), `token exchange for ${client.id}`).toBe(200);
  const ret = (await res.json()) as Record<string, string>;
  await ctx.dispose();
  return ret;
}

async function handshake(page: Page, client: KcClient): Promise<Handshake> {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  const state = base64Url(randomBytes(16));
  const start = performance.now();

  //xxx: the callback is answered here, so the code is never spent by the BFF behind the redirect URI
  const callback = page.waitForRequest(req => req.url().startsWith(REDIRECT_URI), { timeout: 30000 });
  await page.goto(authorizeUrl(client, challenge, state));
  //xxx: with a KC SSO session the authorize redirects at once and there is no form (the hot path)
  if (!page.url().startsWith(REDIRECT_URI)) {
    await page.fill('#username', process.env['E2E_USERNAME']!);
    await page.fill('#password', process.env['E2E_PASSWORD']!);
    await page.click('#kc-login');
  }
  const back = new URL((await callback).url());
  expect(back.searchParams.get('state'), 'state round-trip').toBe(state);
  const code = back.searchParams.get('code');
  expect(code, `authorization code for ${client.id}`).toBeTruthy();

  const tokens = await exchangeCode(client, code!, verifier);
  const ms = performance.now() - start;

  const ret: Handshake = {
    accessToken: tokens['access_token'],
    accessClaims: decodePayload(tokens['access_token']),
    idClaims: decodePayload(tokens['id_token']),
    accessTokenBytes: tokens['access_token'].length,
    ms: ms,
  };
  return ret;
}

async function newCallbackContext(browser: Browser): Promise<BrowserContext> {
  const ret = await browser.newContext();
  await ret.route(`${REDIRECT_URI}**`, route => route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' }));
  return ret;
}

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  let ret = sorted[mid];
  if (sorted.length % 2 === 0) {
    ret = (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return ret;
}

function maxOf(values: number[]): number {
  let ret = values[0];
  for (const v of values) {
    if (v > ret) {
      ret = v;
    }
  }
  return ret;
}

test.describe('pure OAuth client: the token carries no Esquire claims', () => {

  test('the claims client: the token carries esq_uid, esq_rootpath and the realm roles', async ({ browser }) => {
    const ctx = await newCallbackContext(browser);
    const result = await handshake(await ctx.newPage(), CLAIMS);
    const realmAccess = result.accessClaims['realm_access'] as { roles?: string[] } | undefined;

    expect(result.accessClaims['esq_uid'], 'esq_uid').toBeTruthy();
    expect(result.accessClaims['esq_rootpath'], 'esq_rootpath').toBeTruthy();
    expect(Array.isArray(realmAccess?.roles) && realmAccess!.roles!.length > 0, 'realm roles').toBe(true);
    await ctx.close();
  });

  test('the pure client: the token carries the login only', async ({ browser }) => {
    const ctx = await newCallbackContext(browser);
    const result = await handshake(await ctx.newPage(), PURE);

    expect(result.accessClaims['sub'], 'sub').toBeTruthy();
    expect(result.accessClaims['preferred_username'], 'preferred_username').toBe(process.env['E2E_USERNAME']);
    expect(result.accessClaims['azp'], 'azp').toBe(PURE.id);
    expect(result.accessClaims['esq_uid'], 'no esq_uid').toBeUndefined();
    expect(result.accessClaims['esq_rootpath'], 'no esq_rootpath').toBeUndefined();
    expect(result.accessClaims['realm_access'], 'no realm_access').toBeUndefined();
    expect(result.accessClaims['resource_access'], 'no resource_access').toBeUndefined();
    expect(result.idClaims['esq_uid'], 'no esq_uid in the ID token').toBeUndefined();
    expect(result.idClaims['realm_access'], 'no realm_access in the ID token').toBeUndefined();
    await ctx.close();
  });
});

test.describe('handshake timing: cold and hot', () => {
  test.describe.configure({ retries: 0 });

  interface Timing {
    client: KcClient;
    cold: number[];
    hot: number[];
    tokenBytes: number;
  }

  async function round(browser: Browser, timing: Timing, record: boolean): Promise<void> {
    const ctx = await newCallbackContext(browser);
    const page = await ctx.newPage();
    const first = await handshake(page, timing.client);
    const second = await handshake(page, timing.client);
    if (record) {
      timing.cold.push(first.ms);
      timing.hot.push(second.ms);
      timing.tokenBytes = first.accessTokenBytes;
    }
    await ctx.close();
  }

  async function report(timing: Timing, testInfo: TestInfo): Promise<void> {
    const line = `${timing.client.id}: runs=${RUNS} token=${timing.tokenBytes}B`
      + ` cold median=${median(timing.cold).toFixed(1)}ms max=${maxOf(timing.cold).toFixed(1)}ms`
      + ` hot median=${median(timing.hot).toFixed(1)}ms max=${maxOf(timing.hot).toFixed(1)}ms`;
    console.log(line);
    await testInfo.attach(`${timing.client.id}-handshake.json`, {
      body: JSON.stringify({ client: timing.client.id, runs: RUNS, tokenBytes: timing.tokenBytes,
        cold: timing.cold, hot: timing.hot }, null, 2),
      contentType: 'application/json',
    });
  }

  test('the claims client against the pure client', async ({ browser }, testInfo) => {
    test.setTimeout(60_000 + RUNS * 40_000);
    const claims: Timing = { client: CLAIMS, cold: [], hot: [], tokenBytes: 0 };
    const pure: Timing = { client: PURE, cold: [], hot: [], tokenBytes: 0 };

    //xxx: the warm-up round is not recorded -- the first logon after a KC start pays the JIT for both
    await round(browser, claims, false);
    await round(browser, pure, false);
    //xxx: the clients alternate, and which one goes first alternates too, so neither one gets the warmer KC
    for (let i = 0; i < RUNS; i++) {
      if (i % 2 === 0) {
        await round(browser, claims, true);
        await round(browser, pure, true);
      } else {
        await round(browser, pure, true);
        await round(browser, claims, true);
      }
    }

    await report(claims, testInfo);
    await report(pure, testInfo);
  });
});

async function gatewayKey(token: string, headers: Record<string, string>): Promise<{ status: number; body: Record<string, unknown>; ms: number }> {
  const ctx = await pwRequest.newContext();
  const start = performance.now();
  const res = await ctx.get(`${GATEWAY}/esq-key`, { headers: { ...headers, Authorization: `Bearer ${token}` } });
  const ms = performance.now() - start;
  const status = res.status();
  let body: Record<string, unknown> = {};
  if (status === 200) {
    body = (await res.json()) as Record<string, unknown>;
  }
  await ctx.dispose();
  const ret = { status: status, body: body, ms: ms };
  return ret;
}

test.describe('through the gateway: the pure token gets its claims from keySmith', () => {

  test('the claims token and the pure token read the same access profile', async ({ browser }) => {
    const ctx = await newCallbackContext(browser);
    const page = await ctx.newPage();
    const claims = await handshake(page, CLAIMS);
    const pure = await handshake(page, PURE);

    const byClaims = await gatewayKey(claims.accessToken, {});
    const byPure = await gatewayKey(pure.accessToken, {});

    expect(byClaims.status, 'claims token through the gateway').toBe(200);
    expect(byPure.status, 'pure token through the gateway').toBe(200);
    expect(byPure.body['id'], 'the same user').toBe(byClaims.body['id']);
    expect(byPure.body['loginId'], 'login id').toBe(process.env['E2E_USERNAME']);
    await ctx.close();
  });

  test('forged claim headers on a pure call are replaced by the gateway', async ({ browser }) => {
    const ctx = await newCallbackContext(browser);
    const pure = await handshake(await ctx.newPage(), PURE);
    const honest = await gatewayKey(pure.accessToken, {});

    const forged = await gatewayKey(pure.accessToken, { 'X-Esq-UID': '6', 'X-Esq-Root-Path': '1.', 'X-Esq-Roles': 'SYSADMIN,TREE' });

    expect(forged.status).toBe(200);
    expect(forged.body['id'], 'the forged uid is not used').toBe(honest.body['id']);
    await ctx.close();
  });

  test('timing: the first /esq-key call and the next ones, claims token against pure token', async ({ browser }, testInfo) => {
    test.setTimeout(120_000);
    const ctx = await newCallbackContext(browser);
    const page = await ctx.newPage();
    const tokens: Record<string, string> = {
      [CLAIMS.id]: (await handshake(page, CLAIMS)).accessToken,
      [PURE.id]: (await handshake(page, PURE)).accessToken,
    };
    const result: Record<string, number[]> = { [CLAIMS.id]: [], [PURE.id]: [] };
    //xxx: the clients alternate call by call; the pure client's first call may be a cache miss, or a hit
    // left by an earlier test inside the idle time -- the attachment keeps every value
    for (let i = 0; i < API_CALLS; i++) {
      for (const id of [CLAIMS.id, PURE.id]) {
        const call = await gatewayKey(tokens[id], {});
        expect(call.status, `${id} call ${i}`).toBe(200);
        result[id].push(call.ms);
      }
    }
    for (const id of [CLAIMS.id, PURE.id]) {
      const rest = result[id].slice(1);
      console.log(`${id}: /esq-key first=${result[id][0].toFixed(1)}ms next median=${median(rest).toFixed(1)}ms max=${maxOf(rest).toFixed(1)}ms`);
    }
    await testInfo.attach('gateway-esq-key.json', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
    await ctx.close();
  });
});

async function clearKcUserCache(): Promise<void> {
  const ctx = await pwRequest.newContext();
  const login = await ctx.post(`${KC}/realms/master/protocol/openid-connect/token`, {
    form: { grant_type: 'password', client_id: 'admin-cli', username: KC_ADMIN_USER, password: KC_ADMIN_PASSWORD },
  });
  expect(login.status(), 'KC admin login').toBe(200);
  const adminToken = ((await login.json()) as { access_token: string }).access_token;
  const cleared = await ctx.post(`${KC}/admin/realms/${REALM}/clear-user-cache`,
    { headers: { Authorization: `Bearer ${adminToken}` } });
  expect(cleared.status(), 'KC clear-user-cache').toBe(204);
  await ctx.dispose();
}

interface Sample {
  cold: number[];
  hot: number[];
}

interface Figures {
  gateway: Sample;
  logon: Sample;
}

async function logon(page: Page, client: KcClient): Promise<number> {
  const start = performance.now();
  const result = await handshake(page, client);
  const call = await gatewayKey(result.accessToken, {});
  expect(call.status, `${client.id} first /esq-key`).toBe(200);
  return performance.now() - start;
}

//xxx: cold waits out the gateway's idle time first, so a pure call is a claims-cache miss (a keySmith query);
// hot follows at once, so it is a hit. The rich client waits the same, to keep the two under one condition.
async function measureRound(browser: Browser, client: KcClient, figures: Figures, record: boolean): Promise<void> {
  const ctx = await newCallbackContext(browser);
  const page = await ctx.newPage();
  const token = (await handshake(page, client)).accessToken;
  await sleep(GW_IDLE_MS + 500);
  const gatewayCold = await gatewayKey(token, {});
  const gatewayHot = await gatewayKey(token, {});
  expect(gatewayCold.status).toBe(200);
  expect(gatewayHot.status).toBe(200);
  await ctx.close();

  const fresh = await newCallbackContext(browser);
  const freshPage = await fresh.newPage();
  await sleep(GW_IDLE_MS + 500);
  //xxx: cold for Keycloak too -- its user cache is cleared, so the logon reads the user from its database,
  // as a pure cold call reads the claims from Esq2025
  await clearKcUserCache();
  const logonCold = await logon(freshPage, client);
  const logonHot = await logon(freshPage, client);
  await fresh.close();

  if (record) {
    figures.gateway.cold.push(gatewayCold.ms);
    figures.gateway.hot.push(gatewayHot.ms);
    figures.logon.cold.push(logonCold);
    figures.logon.hot.push(logonHot);
  }
}

function line(name: string, sample: Sample): string {
  return `${name}: cold median=${median(sample.cold).toFixed(1)}ms max=${maxOf(sample.cold).toFixed(1)}ms`
    + ` | hot median=${median(sample.hot).toFixed(1)}ms max=${maxOf(sample.hot).toFixed(1)}ms`;
}

const measureDescribe = MEASURE ? test.describe : test.describe.skip;

measureDescribe('measurement: one user, the rich client against the pure client, cold and hot', () => {
  test.describe.configure({ retries: 0 });

  test('the gateway call and the whole logon', async ({ browser }, testInfo) => {
    test.setTimeout(60_000 + RUNS * 2 * (4 * GW_IDLE_MS + 15_000));
    const figures: Record<string, Figures> = {
      [CLAIMS.id]: { gateway: { cold: [], hot: [] }, logon: { cold: [], hot: [] } },
      [PURE.id]: { gateway: { cold: [], hot: [] }, logon: { cold: [], hot: [] } },
    };

    await measureRound(browser, CLAIMS, figures[CLAIMS.id], false);
    await measureRound(browser, PURE, figures[PURE.id], false);
    for (let i = 0; i < RUNS; i++) {
      if (i % 2 === 0) {
        await measureRound(browser, CLAIMS, figures[CLAIMS.id], true);
        await measureRound(browser, PURE, figures[PURE.id], true);
      } else {
        await measureRound(browser, PURE, figures[PURE.id], true);
        await measureRound(browser, CLAIMS, figures[CLAIMS.id], true);
      }
    }

    for (const id of [CLAIMS.id, PURE.id]) {
      console.log(line(`${id} gateway /esq-key`, figures[id].gateway));
      console.log(line(`${id} logon + first /esq-key`, figures[id].logon));
    }
    await testInfo.attach('measurement.json', {
      body: JSON.stringify({ runs: RUNS, gatewayIdleMs: GW_IDLE_MS, figures: figures }, null, 2),
      contentType: 'application/json',
    });
  });
});
