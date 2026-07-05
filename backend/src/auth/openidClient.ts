/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: openid-client v5 init via issuer discovery; cached singleton; getEndSessionUrl helper
 * 06/29/2026 mir0n  discover through config.kc.issuerInternal (server-to-server reachable) instead of the public issuer; log discovered issuer + authorization/token endpoints
 */

import { Issuer, type Client } from 'openid-client';
import type { BackendConfig } from '../config.js';
import { log } from '../util/log.js';

let cachedClient: Client | null = null;

export async function getOidcClient(config: BackendConfig): Promise<Client> {
  let ret = cachedClient;
  if (ret === null) {
    // Discover through the internal URL: it must be reachable from inside the
    // pod. KC's backchannel-dynamic config returns the public issuer and the
    // public authorize/logout endpoints (the browser uses those) but the
    // internal token/jwks endpoints (the BFF calls those server-to-server).
    log.info({ issuerInternal: config.kc.issuerInternal, issuer: config.kc.issuer }, 'discovering KC issuer');
    const issuer = await Issuer.discover(config.kc.issuerInternal);
    log.info({
      issuer: issuer.metadata.issuer,
      authorization_endpoint: issuer.metadata.authorization_endpoint,
      token_endpoint: issuer.metadata.token_endpoint,
    }, 'KC issuer discovered');
    ret = new issuer.Client({
      client_id: config.kc.clientId,
      client_secret: config.kc.clientSecret,
      redirect_uris: [`${config.publicBaseUrl}/auth/callback`],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
    });
    cachedClient = ret;
  }
  return ret;
}

export function getEndSessionUrl(client: Client, idToken: string, postLogoutRedirect: string): string {
  const ret = client.endSessionUrl({
    id_token_hint: idToken,
    post_logout_redirect_uri: postLogoutRedirect,
  });
  return ret;
}
