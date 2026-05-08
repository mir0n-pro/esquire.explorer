/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: express-session middleware; HttpOnly+SameSite=Lax cookie; secure flag from nodeEnv; session shape (tokens, claims, pendingLogin)
 */

import session from 'express-session';
import type { RequestHandler } from 'express';
import type { BackendConfig } from '../config.js';

export interface OidcTokens {
  access_token: string;   // JWE blob; never decrypted in the BFF
  refresh_token?: string;
  id_token?: string;
  expires_at: number;     // epoch seconds
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
