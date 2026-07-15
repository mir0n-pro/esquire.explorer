import { test, expect, request as pwRequest } from '@playwright/test';

// Token Relay coverage (I8). These call the GATEWAY DIRECTLY, not the BFF /api proxy: the BFF injects the
// logged-in session bearer, so a call through it NEVER exercises the relay -- which is exactly why the
// relay's meters stayed empty through every prior e2e run. Two variants share the gateway's /token path:
//   Vanilla -- present HTTP Basic (client_id:client_secret) for an allowlisted client; the gateway runs
//              client_credentials on its behalf and forwards a full JWT downstream.
//   Phantom -- present a Bearer token for an allowlisted client; the gateway runs an RFC 8693
//              token-exchange (as esq-gw-exchange) and forwards the exchanged JWT downstream.
// A relay failure is a 401/500; success is a 200 from a protected route, proving the gateway brokered a
// JWT. Both also light esq.biz.gw.tokenrelay.* on the gateway. Any regression here now fails the build.
//
// URLs default to the docker stack; e2e-k8s.bat overrides GATEWAY_URL / KC_URL for the k8s ingress. The
// client secrets are the dev values from the committed realm import (keycloak/import/esquire.json),
// overridable via env.

const GATEWAY = process.env['GATEWAY_URL'] ?? 'http://localhost:7070';
const KC = process.env['KC_URL'] ?? 'http://localhost:8081/kc-auth';
const REALM = process.env['KC_REALM'] ?? 'esquire';

const VANILLA_ID = process.env['RELAY_VANILLA_CLIENT'] ?? 'esq-hauberk-S';
const VANILLA_SECRET = process.env['RELAY_VANILLA_SECRET'] ?? 'esq-hauberk-s-dev-secret-rotate-in-prod';
const PHANTOM_ID = process.env['RELAY_PHANTOM_CLIENT'] ?? 'esq-hauberk-M';
const PHANTOM_SECRET = process.env['RELAY_PHANTOM_SECRET'] ?? 'esq-hauberk-m-dev-secret-rotate-in-prod';

// A protected read that needs only a valid bearer downstream -- no fixture data. If the relay works the
// gateway forwards a JWT and enyMan answers 200; if it does not, the request is rejected at the edge.
const PROTECTED = '/esq-dict?kind=1000';

const TOKEN_ENDPOINT = `${KC}/realms/${REALM}/protocol/openid-connect/token`;

test('Vanilla Token Relay: HTTP Basic at the edge reaches a protected route', async () => {
  const ctx = await pwRequest.newContext();
  const basic = Buffer.from(`${VANILLA_ID}:${VANILLA_SECRET}`).toString('base64');
  const res = await ctx.get(`${GATEWAY}${PROTECTED}`, { headers: { Authorization: `Basic ${basic}` } });
  expect(res.status(), 'gateway should broker a JWT for the vanilla client').toBe(200);
  await ctx.dispose();
});

test('Phantom Token Relay: exchanged Bearer reaches a protected route', async () => {
  const ctx = await pwRequest.newContext();

  const tokenRes = await ctx.post(TOKEN_ENDPOINT, {
    form: { grant_type: 'client_credentials', client_id: PHANTOM_ID, client_secret: PHANTOM_SECRET },
  });
  expect(tokenRes.status(), 'KC should issue a token for the phantom client').toBe(200);
  const token = ((await tokenRes.json()) as { access_token?: string }).access_token;
  expect(token, 'access_token present').toBeTruthy();

  const res = await ctx.get(`${GATEWAY}${PROTECTED}`, { headers: { Authorization: `Bearer ${token}` } });
  expect(res.status(), 'gateway should exchange and broker a JWT for the phantom client').toBe(200);
  await ctx.dispose();
});
