/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: openid-client v5 init via issuer discovery; cached singleton; getEndSessionUrl helper
 */

import { Issuer, type Client } from 'openid-client';
import type { BackendConfig } from '../config.js';
import { log } from '../util/log.js';

let cachedClient: Client | null = null;

export async function getOidcClient(config: BackendConfig): Promise<Client> {
  let ret = cachedClient;
  if (ret === null) {
    log.info({ issuer: config.kc.issuer }, 'discovering KC issuer');
    const issuer = await Issuer.discover(config.kc.issuer);
    log.info({ endpoint: issuer.metadata.authorization_endpoint }, 'KC issuer discovered');
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
