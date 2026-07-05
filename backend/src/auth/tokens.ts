/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: getValidAccessToken with refresh-on-expiry via openid-client; NoSessionError sentinel for missing-session signalling
 * 07/02/2026 mir0n  refreshExpiresAt(tokenSet) = now + refresh_expires_in; a refresh carries session_expires_at forward
 */

import type { Request } from 'express';
import { getOidcClient } from './openidClient.js';
import type { BackendConfig } from '../config.js';
import type { OidcTokens } from './sessionStore.js';
import { log } from '../util/log.js';

const REFRESH_LEEWAY_SECONDS = 30;

export class NoSessionError extends Error {
  constructor() {
    super('no authenticated session');
  }
}

export class RefreshFailedError extends Error {
  constructor(cause?: unknown) {
    super('token refresh failed');
    this.cause = cause;
  }
}

function nowSeconds(): number {
  const ret = Math.floor(Date.now() / 1000);
  return ret;
}

/**
 * The session's death time -- when the refresh token expires and the session can
 * no longer be renewed. Derived from KeyCloak's `refresh_expires_in` (seconds from
 * now) on the token response. Undefined if the provider did not return it (the
 * frontend then skips the proactive pre-empt and relies on the 401->login redirect).
 */
export function refreshExpiresAt(tokenSet: unknown): number | undefined {
  const raw = (tokenSet as Record<string, unknown> | null)?.['refresh_expires_in'];
  return typeof raw === 'number' ? nowSeconds() + raw : undefined;
}

export async function getValidAccessToken(req: Request, config: BackendConfig): Promise<string> {
  let ret: string;
  const tokens = req.session.tokens;
  if (tokens === undefined || tokens.access_token === undefined) {
    throw new NoSessionError();
  }

  if (tokens.expires_at - REFRESH_LEEWAY_SECONDS > nowSeconds()) {
    ret = tokens.access_token;
  } else if (tokens.refresh_token === undefined) {
    throw new NoSessionError();
  } else {
    ret = await refresh(req, config);
  }
  return ret;
}

async function refresh(req: Request, config: BackendConfig): Promise<string> {
  let ret: string;
  const tokens = req.session.tokens;
  if (tokens === undefined || tokens.refresh_token === undefined) {
    throw new NoSessionError();
  }
  try {
    const client = await getOidcClient(config);
    const tokenSet = await client.refresh(tokens.refresh_token);
    if (tokenSet.access_token === undefined || tokenSet.expires_at === undefined) {
      throw new RefreshFailedError('refresh response missing access_token or expires_at');
    }
    const updated: OidcTokens = {
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token ?? tokens.refresh_token,
      id_token: tokenSet.id_token ?? tokens.id_token,
      expires_at: tokenSet.expires_at,
      // KC rotates the refresh token on each refresh with a fresh lifetime (capped by
      // the SSO session max), so an active session slides forward; keep the prior value
      // if the provider omitted it.
      session_expires_at: refreshExpiresAt(tokenSet) ?? tokens.session_expires_at,
      token_type: tokenSet.token_type ?? tokens.token_type,
    };
    req.session.tokens = updated;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    log.info({ sid: req.sessionID }, 'access token refreshed');
    ret = updated.access_token;
  } catch (err) {
    log.warn({ err }, 'token refresh failed');
    throw new RefreshFailedError(err);
  }
  return ret;
}
