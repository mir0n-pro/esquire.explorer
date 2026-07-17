/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: load BackendConfig from env (publicBaseUrl, allowedOrigins, KC issuer/client, gateway URL, session secret, dict cache)
 * 06/27/2026 mir0n  added session.redisUrl from REDIS_URL env (default empty) -- shared session store endpoint
 * 06/29/2026 mir0n  added kc.issuerInternal (KC_ISSUER_INTERNAL env, defaults to issuer); added server.requestTimeoutMs (BFF_REQUEST_TIMEOUT_MS) + proxy.timeoutMs (BFF_PROXY_TIMEOUT_MS), both default 0
 * 07/08/2026 mir0n  v1.2.11 -- added tracing { enabled, otlpEndpoint, samplingRatio } from ESQ_TRACING_ENABLED / ESQ_OTLP_ENDPOINT / ESQ_TRACING_SAMPLING_RATIO (off by default)
 * 07/15/2026 mir0n  v1.2.11 T11 -- tracing.enabled now reads ESQ_OBSERVABILITY_ENABLED (was ESQ_TRACING_ENABLED),
 *                   the same umbrella switch the Java services use; it gates the BFF tracing AND the BFF metrics
 *                   surface (I13)
 * 07/17/2026 mir0n  per-pillar sub-switches: a separate metrics.enabled, and tracing.enabled via pillarOn under
 *                   the ESQ_OBSERVABILITY_ENABLED umbrella (I41).
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
    // Public, browser-facing realm issuer -- the token issuer and the base for
    // authorize / end_session redirects.
    issuer: string;
    // URL the BFF discovers KC through server-to-server. Defaults to issuer.
    // On local k8s the public host is loopback inside a pod, so this points at
    // the in-cluster KC service; KC's backchannel-dynamic config keeps the
    // discovered issuer + browser endpoints public while the token/jwks
    // endpoints resolve to the reachable internal URL.
    issuerInternal: string;
    clientId: string;
    clientSecret: string;
  };
  gateway: {
    url: string;
  };
  // Request-path timeouts (R1). Both default 0 = pre-HA (Node's own request-timeout default; no proxy
  // timeout). HA sets them via env (local-k8s chart): requestTimeoutMs bounds a slow inbound request,
  // proxyTimeoutMs bounds the BFF->gateway hop so a stuck upstream frees the socket.
  server: {
    requestTimeoutMs: number;
  };
  proxy: {
    timeoutMs: number;
  };
  session: {
    secret: string;
    cookieName: string;
    maxAgeMs: number;
    // Shared session store endpoint. When set, sessions live in Redis so every
    // BFF replica reads the same session (required to run more than one replica).
    // When empty, express-session falls back to its in-memory MemoryStore --
    // correct only at a single replica. Set REDIS_URL on local k8s (where the
    // infra redis runs); leave it unset on OKE, which keeps the BFF at one replica.
    redisUrl: string;
  };
  cache: {
    ttlMs: number;
    maxEntries: number;
  };
  // Distributed tracing (v1.2.11 O2). When enabled, the BFF emits a root OTel span per request
  // (traceId == the settled correlation id) and exports it over OTLP to the collector. Off by
  // default (same posture as the Java services); the o11y stack + env turn it on. `enabled` is the
  // per-pillar EFFECTIVE value: master AND the tracing sub-switch (I41) -- see loadConfig.
  tracing: {
    enabled: boolean;
    otlpEndpoint: string;
    samplingRatio: number;
  };
  // Metrics pillar (O1/T5c): the Prometheus /metrics surface. `enabled` is the per-pillar EFFECTIVE
  // value: master AND the metrics sub-switch (I41). Peer of tracing under the one observability master,
  // so the BFF matches the Java services -- either pillar can run without the other (mesh coexistence).
  metrics: {
    enabled: boolean;
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
  const kcIssuer = required('KC_ISSUER', 'http://localhost:8080/kc-auth/realms/esquire');
  const ret: BackendConfig = {
    port: Number(process.env.PORT ?? 3000),
    nodeEnv,
    publicBaseUrl,
    allowedOrigins,
    kc: {
      issuer: kcIssuer,
      issuerInternal: process.env.KC_ISSUER_INTERNAL ?? kcIssuer,
      clientId: required('KC_CLIENT_ID', 'esq-angular'),
      clientSecret: required('KC_CLIENT_SECRET', 'esq-angular-bff-dev-secret-rotate-in-prod'),
    },
    gateway: {
      url: required('GATEWAY_URL', 'http://localhost:7070'),
    },
    server: {
      requestTimeoutMs: Number(process.env.BFF_REQUEST_TIMEOUT_MS ?? 0),
    },
    proxy: {
      timeoutMs: Number(process.env.BFF_PROXY_TIMEOUT_MS ?? 0),
    },
    session: {
      secret: required('SESSION_SECRET', 'dev-session-secret-replace-me'),
      cookieName: 'esq.sid',
      maxAgeMs: Number(process.env.SESSION_MAX_AGE_MS ?? 12 * 60 * 60 * 1000),
      redisUrl: process.env.REDIS_URL ?? '',
    },
    cache: {
      ttlMs: Number(process.env.ESQ_DICT_CACHE_TTL_MS ?? 60 * 60 * 1000),
      maxEntries: Number(process.env.ESQ_DICT_CACHE_MAX ?? 64),
    },
    tracing: {
      enabled: pillarOn(process.env.ESQ_TRACING_ENABLED),
      otlpEndpoint: process.env.ESQ_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
      samplingRatio: Number(process.env.ESQ_TRACING_SAMPLING_RATIO ?? 1.0),
    },
    metrics: {
      enabled: pillarOn(process.env.ESQ_METRICS_ENABLED),
    },
  };
  return ret;
}

// Per-pillar enable (I41), mirroring the Java services: the observability MASTER
// (ESQ_OBSERVABILITY_ENABLED) gates everything; each pillar then has a sub-switch that DEFAULTS to on,
// so a bare master keeps both pillars up (unchanged). Effective = master AND sub. An unset or empty
// sub follows the master; an explicit "false" turns just that pillar off -- e.g. ESQ_TRACING_ENABLED=false
// runs the BFF metrics-only, the service-mesh coexistence case (a mesh already traces the wire).
function pillarOn(sub: string | undefined): boolean {
  const master = process.env.ESQ_OBSERVABILITY_ENABLED === 'true';
  const subOn = sub === undefined || sub === '' ? true : sub === 'true';
  return master && subOn;
}
