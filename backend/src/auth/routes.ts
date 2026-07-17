/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: /auth/login, /callback, /logout, /me; OIDC code+PKCE flow; per-request redirect_uri resolved from Origin/Referer against allowedOrigins
 * 07/02/2026 mir0n  session-expiry: callback stores session_expires_at; /auth/me returns sessionExpiresAt and reports authenticated:false once the refresh-token window has passed
 * 07/17/2026 mir0n  the KeyCloak token exchange (callback) is wrapped in traceKcCall (CLIENT span).
 */

import { Router, type Request, type Response } from 'express';
import { generators } from 'openid-client';
import { getOidcClient, getEndSessionUrl } from './openidClient.js';
import { refreshExpiresAt } from './tokens.js';
import type { BackendConfig } from '../config.js';
import type { OidcTokens, SessionClaims } from './sessionStore.js';
import { log } from '../util/log.js';
import { traceKcCall } from '../util/trace.js';

export function buildAuthRouter(config: BackendConfig): Router {
  const ret = Router();

  ret.get('/login', loginHandler(config));
  ret.get('/callback', callbackHandler(config));
  ret.post('/logout', logoutHandler(config));
  ret.get('/me', meHandler);

  return ret;
}

/**
 * Pick the browser-visible origin from the incoming request and validate it
 * against config.allowedOrigins. Returns the matched origin or publicBaseUrl.
 *
 * Why both Referer and Origin: top-level navigations (GET /auth/login from
 * a link) often omit Origin; Referer is the page that triggered the click.
 * Cross-origin fetches set Origin. We prefer Origin when present, then fall
 * back to Referer's origin part.
 */
function resolveOrigin(req: Request, config: BackendConfig): string {
  const candidates: string[] = [];
  const originHdr = headerValue(req.headers['origin']);
  if (originHdr !== undefined) {
    candidates.push(originHdr);
  }
  const refererHdr = headerValue(req.headers['referer']);
  if (refererHdr !== undefined) {
    try {
      const u = new URL(refererHdr);
      candidates.push(`${u.protocol}//${u.host}`);
    } catch {
      // ignore malformed Referer
    }
  }
  let ret = config.publicBaseUrl;
  for (const c of candidates) {
    if (config.allowedOrigins.includes(c)) {
      ret = c;
      break;
    }
  }
  return ret;
}

function headerValue(raw: string | string[] | undefined): string | undefined {
  let ret: string | undefined;
  if (Array.isArray(raw)) {
    ret = raw[0];
  } else if (typeof raw === 'string' && raw.length > 0) {
    ret = raw;
  }
  return ret;
}

function loginHandler(config: BackendConfig) {
  return async (req: Request, res: Response): Promise<void> => {
    let ret: string | null = null;
    try {
      const client = await getOidcClient(config);
      const state = generators.state();
      const nonce = generators.nonce();
      const codeVerifier = generators.codeVerifier();
      const codeChallenge = generators.codeChallenge(codeVerifier);
      const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : undefined;

      const origin = resolveOrigin(req, config);
      const redirectUri = `${origin}/auth/callback`;

      req.session.pendingLogin = { state, nonce, codeVerifier, returnTo, redirectUri };
      await saveSession(req);

      ret = client.authorizationUrl({
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });
      res.redirect(ret);
    } catch (err) {
      log.error({ err }, 'login init failed');
      res.status(500).json({ error: 'login init failed' });
    }
  };
}

function callbackHandler(config: BackendConfig) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const pending = req.session.pendingLogin;
      if (pending === undefined) {
        res.status(400).json({ error: 'no pending login' });
        return;
      }
      const client = await getOidcClient(config);
      const params = client.callbackParams(req);
      const tokenSet = await traceKcCall('KC token exchange', () => client.callback(
        pending.redirectUri,
        params,
        { state: pending.state, nonce: pending.nonce, code_verifier: pending.codeVerifier },
      ));
      if (tokenSet.access_token === undefined || tokenSet.expires_at === undefined) {
        res.status(500).json({ error: 'token response missing access_token or expires_at' });
        return;
      }

      const claims: SessionClaims = extractClaims(tokenSet.claims());

      const tokens: OidcTokens = {
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        id_token: tokenSet.id_token,
        expires_at: tokenSet.expires_at,
        session_expires_at: refreshExpiresAt(tokenSet),
        token_type: tokenSet.token_type,
      };
      // Land back on the browser-visible origin we came from. Same-origin
      // path so the cookie (set on host, port-agnostic) carries through.
      const callbackOrigin = pending.redirectUri.replace(/\/auth\/callback$/, '');
      const returnTo = pending.returnTo ?? `${callbackOrigin}/`;

      // Anti-fixation: regenerate session id BEFORE writing tokens
      await regenerateSession(req);
      req.session.tokens = tokens;
      req.session.claims = claims;
      delete req.session.pendingLogin;
      await saveSession(req);

      log.info({ sub: claims.sub, sid: req.sessionID, origin: callbackOrigin }, 'login complete');
      res.redirect(returnTo);
    } catch (err) {
      log.error({ err }, 'callback failed');
      res.status(500).json({ error: 'callback failed' });
    }
  };
}

function logoutHandler(config: BackendConfig) {
  return async (req: Request, res: Response): Promise<void> => {
    let ret: string;
    const idToken = req.session.tokens?.id_token;
    const origin = resolveOrigin(req, config);
    const postLogout = `${origin}/`;
    try {
      if (idToken !== undefined) {
        const client = await getOidcClient(config);
        ret = getEndSessionUrl(client, idToken, postLogout);
      } else {
        ret = postLogout;
      }
      await destroySession(req, res, config.session.cookieName);
      res.redirect(ret);
    } catch (err) {
      log.error({ err }, 'logout failed');
      res.status(500).json({ error: 'logout failed' });
    }
  };
}

async function meHandler(req: Request, res: Response): Promise<void> {
  const tokens = req.session.tokens;
  const claims = req.session.claims;
  // Report authoritative auth state: once the refresh token has expired the session
  // can no longer be renewed, so it is not authenticated even though the session
  // object still holds stale tokens. Reporting false here keeps the SPA on the
  // landing (lazy-auth) instead of firing a cold /api/* call that would 401-loop.
  const expired = tokens?.session_expires_at !== undefined
    && tokens.session_expires_at * 1000 <= Date.now();
  if (tokens === undefined || claims === undefined || expired) {
    res.json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    username: claims.preferred_username ?? claims.sub,
    roles: claims.roles,
    expiresAt: tokens.expires_at,
    sessionExpiresAt: tokens.session_expires_at,
  });
}

function extractClaims(idClaims: Record<string, unknown>): SessionClaims {
  const realmAccess = idClaims['realm_access'] as { roles?: string[] } | undefined;
  const ret: SessionClaims = {
    sub: String(idClaims['sub'] ?? ''),
    preferred_username: typeof idClaims['preferred_username'] === 'string' ? idClaims['preferred_username'] : undefined,
    roles: Array.isArray(realmAccess?.roles) ? realmAccess.roles : [],
  };
  return ret;
}

function saveSession(req: Request): Promise<void> {
  const ret = new Promise<void>((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  return ret;
}

function regenerateSession(req: Request): Promise<void> {
  const ret = new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  return ret;
}

function destroySession(req: Request, res: Response, cookieName: string): Promise<void> {
  const ret = new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
      } else {
        res.clearCookie(cookieName, { path: '/' });
        resolve();
      }
    });
  });
  return ret;
}
