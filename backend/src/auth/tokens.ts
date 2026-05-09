/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: getValidAccessToken with refresh-on-expiry via openid-client; NoSessionError sentinel for missing-session signalling
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
