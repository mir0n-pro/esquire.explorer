/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: BFF entrypoint; Express server; mounts /auth, /api proxy, baked SPA static, /readyz
 * 06/29/2026 mir0n  set server.requestTimeout from config.server.requestTimeoutMs when > 0 (R1; 0 leaves Node's default)
 * 07/08/2026 mir0n  v1.2.11 -- initTracing(config) before any request is handled; SIGTERM flushes in-flight spans via shutdownTracing() before the server closes (both from util/trace.ts, alongside traceMiddleware)
 * 07/10/2026 mir0n  v1.2.11 -- BFF metrics surface (O1): initMetrics(config) at startup, metricsMiddleware times each request, and a /metrics route (all from util/metrics.ts); no-op when observability is off
 */

import express from 'express';
import { loadConfig } from './config.js';
import { log, httpLogger } from './util/log.js';
import { buildSessionMiddleware } from './auth/sessionStore.js';
import { buildAuthRouter } from './auth/routes.js';
import { getOidcClient } from './auth/openidClient.js';
import { buildApiProxy } from './proxy/apiProxy.js';
import { buildSpaHandler } from './static/spa.js';
import { traceMiddleware, initTracing, shutdownTracing } from './util/trace.js';
import { initMetrics, metricsMiddleware, metricsHandler } from './util/metrics.js';

const config = loadConfig();
// Wire the OTel tracer before any request is handled (traceMiddleware opens the BFF span). No-op
// when tracing is disabled.
initTracing(config);
initMetrics(config);   // BFF Prometheus /metrics (T5c); no-op when observability off
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(traceMiddleware);
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);
app.use(httpLogger);

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', (_req, res) => {
  res.status(200).json({ status: 'ready' });
});

app.use(buildSessionMiddleware(config));
app.use('/auth', buildAuthRouter(config));
app.use('/api', buildApiProxy(config));

const spaHandler = buildSpaHandler();
if (spaHandler !== null) {
  app.use(spaHandler);
}

// Eagerly discover the KC issuer at startup so the first /auth/login is fast and
// startup fails loud (not at first request) when KC is misconfigured.
getOidcClient(config).catch((err) => {
  log.error({ err }, 'OIDC issuer discovery failed at startup -- /auth/* will retry on demand');
});

const server = app.listen(config.port, () => {
  log.info({ port: config.port, nodeEnv: config.nodeEnv }, 'esquire backend listening');
});

// R1 request-path bound: when set (>0), cap a slow inbound request so it cannot hold a socket
// indefinitely. 0 (the pre-HA default) leaves Node's own requestTimeout default in place.
if (config.server.requestTimeoutMs > 0) {
  server.requestTimeout = config.server.requestTimeoutMs;
}

// Flush in-flight spans before the process exits (docker/k8s send SIGTERM on stop).
process.once('SIGTERM', () => {
  void shutdownTracing().finally(() => server.close(() => process.exit(0)));
});
