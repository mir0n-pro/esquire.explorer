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
 */

import express from 'express';
import { loadConfig } from './config.js';
import { log, httpLogger } from './util/log.js';
import { buildSessionMiddleware } from './auth/sessionStore.js';
import { buildAuthRouter } from './auth/routes.js';
import { getOidcClient } from './auth/openidClient.js';
import { buildApiProxy } from './proxy/apiProxy.js';
import { buildSpaHandler } from './static/spa.js';
import { traceMiddleware } from './util/trace.js';

const config = loadConfig();
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(traceMiddleware);
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
