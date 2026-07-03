/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: express-session middleware; HttpOnly+SameSite=Lax cookie; secure flag from nodeEnv; session shape (tokens, claims, pendingLogin)
 * 06/27/2026 mir0n  session store selectable -- buildSessionStore() returns connect-redis RedisStore (prefix esq.sess:) when session.redisUrl set, else MemoryStore
 * 07/02/2026 mir0n  OidcTokens gains session_expires_at (epoch ms of the refresh-token window) for the session-expiry pre-empt
 */

import session, { type Store } from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import type { RequestHandler } from 'express';
import type { BackendConfig } from '../config.js';
import { log } from '../util/log.js';

export interface OidcTokens {
  access_token: string;   // JWE blob; never decrypted in the BFF
  refresh_token?: string;
  id_token?: string;
  expires_at: number;         // access-token expiry, epoch seconds (auto-refreshed)
  session_expires_at?: number; // refresh-token / session expiry, epoch seconds (session dies here)
  token_type?: string;
}

export interface SessionClaims {
  sub: string;
  preferred_username?: string;
  roles: string[];
}

export interface PendingLogin {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo?: string;
  // Per-request redirect_uri chosen at /auth/login from the browser-visible
  // origin (Referer/Origin header). Reused at /auth/callback so the OIDC
  // round-trip stays anchored to the originating port (e.g. :4200 dev
  // doesn't bounce to :3000).
  redirectUri: string;
}

declare module 'express-session' {
  interface SessionData {
    tokens?: OidcTokens;
    claims?: SessionClaims;
    pendingLogin?: PendingLogin;
  }
}

export function buildSessionMiddleware(config: BackendConfig): RequestHandler {
  const ret = session({
    name: config.session.cookieName,
    secret: config.session.secret,
    store: buildSessionStore(config),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      path: '/',
      maxAge: config.session.maxAgeMs,
    },
  });
  return ret;
}

/**
 * Pick the session store. With session.redisUrl set, sessions live in Redis so
 * every replica reads the same session -- the prerequisite for running the BFF
 * at more than one replica. With it empty, return undefined so express-session
 * uses its default in-memory MemoryStore (correct only at a single replica).
 *
 * The client connects in the background (first request lands after startup, by
 * which time it is up). A connect failure is logged, not thrown, so the BFF
 * still starts; session reads then fail loudly per-request rather than at boot.
 */
function buildSessionStore(config: BackendConfig): Store | undefined {
  let ret: Store | undefined;
  if (config.session.redisUrl.length > 0) {
    const client = createClient({ url: config.session.redisUrl });
    client.on('error', (err) => log.error({ err }, 'session store: redis client error'));
    client.connect().then(
      () => log.info('session store: redis connected (shared store)'),
      (err) => log.error({ err }, 'session store: redis connect failed'),
    );
    ret = new RedisStore({ client, prefix: 'esq.sess:' });
  } else {
    log.info('session store: in-memory MemoryStore (single replica only)');
  }
  return ret;
}
