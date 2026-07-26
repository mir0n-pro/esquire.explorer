/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: /api/* server-to-server proxy to gateway; injects Bearer; cacheable GET path for esq-kinds/dictionary; X-Request-ID propagation
 * 06/29/2026 mir0n  set proxyTimeout from config.proxy.timeoutMs when > 0 (R1; 0 omits it)
 * 07/08/2026 mir0n  v1.2.11 -- upstream calls carry Esq-Correlation-ID (the settled id, replacing the
 *                   forward-only X-Correlation-ID) plus the traceparent built from that same id, on both the
 *                   cacheable GET path and the proxied path
 * 07/17/2026 mir0n  the BFF->gateway hop is timed via timeUpstream (esq_bff_outbound_duration_seconds), stopped
 *                   once on both proxy paths -- idempotent so the res close event cannot double-count
 *                   (I42/L8+L9).
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import type { ClientRequest, IncomingMessage, ServerResponse } from 'http';
import { buildDictCache, type DictCache } from './cache.js';
import { getValidAccessToken, NoSessionError } from '../auth/tokens.js';
import type { BackendConfig } from '../config.js';
import { log } from '../util/log.js';
import { timeUpstream, type UpstreamOutcome } from '../util/metrics.js';

const HEADER_CACHE_STATUS = 'X-Esq-Cache';
const HEADER_AUTH = 'authorization';

// Per-request state the proxy hooks read back off the request object. The hooks are given a plain
// IncomingMessage by http-proxy-middleware, but at runtime it IS the Express request, so both sides cast to
// this one shape rather than repeating an inline intersection type at every hook.
interface EsqProxyState {
  _esqAccessToken?: string;
  _esqStopUpstream?: (outcome: UpstreamOutcome) => void;
}

export function buildApiProxy(config: BackendConfig): RequestHandler {
  const cache = buildDictCache(config);
  const proxy = buildProxyMiddleware(config);

  const ret: RequestHandler = async (req, res, next) => {
    if (req.session.tokens === undefined) {
      res.status(401).json({ error: 'no session' });
      return;
    }

    const cacheKey = req.method === 'GET' ? cache.keyForRequest(req.path, req.query as Record<string, string | string[] | undefined>) : null;
    if (cacheKey !== null) {
      await handleCacheable(req, res, next, config, cache, cacheKey);
    } else {
      await handleProxy(req, res, next, config, proxy);
    }
  };
  return ret;
}

async function handleCacheable(
  req: Request,
  res: Response,
  next: NextFunction,
  config: BackendConfig,
  cache: DictCache,
  cacheKey: string,
): Promise<void> {
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    res.setHeader(HEADER_CACHE_STATUS, 'HIT');
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(cached.status).end(cached.body);
    return;
  }

  let token: string;
  try {
    token = await getValidAccessToken(req, config);
  } catch (err) {
    if (err instanceof NoSessionError) {
      res.status(401).json({ error: 'no session' });
    } else {
      log.error({ err }, 'cacheable: token resolution failed');
      res.status(502).json({ error: 'upstream auth failed' });
    }
    return;
  }

  const upstreamUrl = `${config.gateway.url}${req.originalUrl.replace(/^\/api/, '')}`;
  const upstreamHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: req.headers.accept ?? 'application/json',
    'X-Request-ID': req.esqRequestId,
    // The BFF posts the canonical correlation id (the gateway settles from it) + the traceparent
    // carrying the same id, so the gateway's OTel span traceId == the correlation id (T2.3).
    'Esq-Correlation-ID': req.esqCorrelationId,
    traceparent: req.esqTraceparent,
  };
  // I42/L8: time the outbound leg to the gateway -- the step's own number. The clock stops only after the BODY is
  // read, not when fetch() resolves: fetch settles once the HEADERS arrive, so stopping there would measure a
  // fraction of the round-trip and read fast while a large or slow body was still streaming.
  const stopUpstream = timeUpstream(req);
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: upstreamHeaders,
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    stopUpstream('ok');
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    if (upstream.ok) {
      cache.set(cacheKey, { status: upstream.status, contentType, body: buf });
    }
    log.info({ cacheKey, status: upstream.status, bytes: buf.length, contentType }, 'cacheable: upstream response');
    res.setHeader(HEADER_CACHE_STATUS, 'MISS');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(upstream.status).end(buf);
  } catch (err) {
    // A failed call HAS a duration too -- how long the BFF waited before giving up. Recording it here keeps a
    // timeout or a refused connection visible in the histogram instead of silently vanishing from the count.
    stopUpstream('error');
    log.error({ err, upstreamUrl }, 'cacheable: upstream fetch failed');
    next(err);
  }
}

async function handleProxy(
  req: Request,
  res: Response,
  next: NextFunction,
  config: BackendConfig,
  proxy: RequestHandler,
): Promise<void> {
  let token: string;
  try {
    token = await getValidAccessToken(req, config);
  } catch (err) {
    if (err instanceof NoSessionError) {
      res.status(401).json({ error: 'no session' });
    } else {
      log.error({ err }, 'proxy: token resolution failed');
      res.status(502).json({ error: 'upstream auth failed' });
    }
    return;
  }
  // Stash the token for the proxyReq hook to read — avoids re-resolving inside the hook.
  const ext = req as Request & EsqProxyState;
  ext._esqAccessToken = token;
  // I42/L9: start the clock on the outbound leg and stash the stop for the proxy hooks. Started HERE rather than
  // in the proxyReq hook because req is properly typed here (routeLabel needs the Express baseUrl), and it keeps
  // the start point symmetric with L8, which starts just before its fetch(). The token resolution above is
  // deliberately OUTSIDE the window -- it is the BFF's own work (often a cache hit), not the gateway hop.
  ext._esqStopUpstream = timeUpstream(req);
  proxy(req, res, next);
}

function buildProxyMiddleware(config: BackendConfig): RequestHandler {
  const options: Options = {
    target: config.gateway.url,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    xfwd: true,
    // R1: bound the BFF->gateway hop so a stuck upstream frees the socket. 0 (pre-HA default) omits it.
    ...(config.proxy.timeoutMs > 0 ? { proxyTimeout: config.proxy.timeoutMs } : {}),
    on: {
      proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
        const ext = req as IncomingMessage & EsqProxyState & { esqRequestId?: string; esqCorrelationId?: string; esqTraceparent?: string };
        if (ext._esqAccessToken !== undefined) {
          proxyReq.setHeader(HEADER_AUTH, `Bearer ${ext._esqAccessToken}`);
        }
        if (ext.esqRequestId !== undefined) {
          proxyReq.setHeader('X-Request-ID', ext.esqRequestId);
        }
        // The BFF posts the canonical correlation id (the gateway settles from it); the traceparent
        // carries the same id so the gateway's OTel span traceId == the correlation id (T2.3).
        if (ext.esqCorrelationId !== undefined) {
          proxyReq.setHeader('Esq-Correlation-ID', ext.esqCorrelationId);
        }
        if (ext.esqTraceparent !== undefined) {
          proxyReq.setHeader('traceparent', ext.esqTraceparent);
        }
      },
      // I42/L9: stop the clock when the upstream leg ENDS. Two signals are watched, and the stop is idempotent
      // (see timeUpstream) so the first one wins:
      //   proxyRes body 'end' -> ok    -- the whole upstream response has been received. Waiting for 'end' rather
      //                                   than for the proxyRes event itself matters: proxyRes fires on HEADERS,
      //                                   so stopping there would miss the body, exactly as fetch() would in L8.
      //   res 'close'         -> error -- the response ended without the body completing, i.e. the client hung up
      //                                   mid-stream. It HAS a duration (how long the BFF waited) and must not
      //                                   vanish from the count -- the same reasoning as L2's 'cancelled'. On a
      //                                   healthy request 'close' also fires, but AFTER 'end' has already won.
      proxyRes: (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
        const stop = (req as IncomingMessage & EsqProxyState)._esqStopUpstream;
        if (stop !== undefined) {
          proxyRes.on('end', () => { stop('ok'); });
          res.on('close', () => { stop('error'); });
        }
      },
      error: (err, req) => {
        // A refused connection / proxy timeout: the leg has a duration too -- how long the BFF waited.
        (req as IncomingMessage & EsqProxyState)._esqStopUpstream?.('error');
        log.error({ err }, 'proxy upstream error');
      },
    },
  };
  return createProxyMiddleware(options) as unknown as RequestHandler;
}
