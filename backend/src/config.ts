/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: load BackendConfig from env (publicBaseUrl, allowedOrigins, KC issuer/client, gateway URL, session secret, dict cache)
 */

export interface BackendConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  publicBaseUrl: string;
  // Origins that the BFF accepts for /auth/* redirect_uri / post-logout
  // resolution. The browser-visible origin is taken from the incoming
  // request (Referer/Origin header) and validated against this list.
  // Origins outside the list fall back to publicBaseUrl. Always includes
  // publicBaseUrl. Set ALLOWED_ORIGINS to a comma-separated list to extend.
  allowedOrigins: string[];
  kc: {
    issuer: string;
    clientId: string;
    clientSecret: string;
  };
  gateway: {
    url: string;
  };
  session: {
    secret: string;
    cookieName: string;
    maxAgeMs: number;
  };
  cache: {
    ttlMs: number;
    maxEntries: number;
  };
}

function required(name: string, fallback?: string): string {
  const ret = process.env[name] ?? fallback;
  if (ret === undefined) {
    throw new Error(`required env var not set: ${name}`);
  }
  return ret;
}

export function loadConfig(): BackendConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as BackendConfig['nodeEnv'];
  const publicBaseUrl = required('PUBLIC_BASE_URL', 'http://localhost:3000');
  const allowedFromEnv = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(s => s.length > 0);
  const allowedOrigins = Array.from(new Set([publicBaseUrl, ...allowedFromEnv]));
  const ret: BackendConfig = {
    port: Number(process.env.PORT ?? 3000),
    nodeEnv,
    publicBaseUrl,
    allowedOrigins,
    kc: {
      issuer: required('KC_ISSUER', 'http://localhost:8080/kc-auth/realms/esquire'),
      clientId: required('KC_CLIENT_ID', 'esq-angular'),
      clientSecret: required('KC_CLIENT_SECRET', 'esq-angular-bff-dev-secret-rotate-in-prod'),
    },
    gateway: {
      url: required('GATEWAY_URL', 'http://localhost:7070'),
    },
    session: {
      secret: required('SESSION_SECRET', 'dev-session-secret-replace-me'),
      cookieName: 'esq.sid',
      maxAgeMs: Number(process.env.SESSION_MAX_AGE_MS ?? 12 * 60 * 60 * 1000),
    },
    cache: {
      ttlMs: Number(process.env.ESQ_DICT_CACHE_TTL_MS ?? 60 * 60 * 1000),
      maxEntries: Number(process.env.ESQ_DICT_CACHE_MAX ?? 64),
    },
  };
  return ret;
}
