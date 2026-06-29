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
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import type { ClientRequest, IncomingMessage } from 'http';
import { buildDictCache, type DictCache } from './cache.js';
import { getValidAccessToken, NoSessionError } from '../auth/tokens.js';
import type { BackendConfig } from '../config.js';
import { log } from '../util/log.js';

const HEADER_CACHE_STATUS = 'X-Esq-Cache';
const HEADER_AUTH = 'authorization';

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
  };
  if (req.esqCorrelationId !== undefined) {
    upstreamHeaders['X-Correlation-ID'] = req.esqCorrelationId;
  }
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: upstreamHeaders,
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
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
  (req as Request & { _esqAccessToken?: string })._esqAccessToken = token;
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
        const ext = req as IncomingMessage & { _esqAccessToken?: string; esqRequestId?: string; esqCorrelationId?: string };
        if (ext._esqAccessToken !== undefined) {
          proxyReq.setHeader(HEADER_AUTH, `Bearer ${ext._esqAccessToken}`);
        }
        if (ext.esqRequestId !== undefined) {
          proxyReq.setHeader('X-Request-ID', ext.esqRequestId);
        }
        // Don't forward an absent correlation id -- gateway will generate one.
        // Only forward if the client set it explicitly (ad-hoc debug case).
        if (ext.esqCorrelationId !== undefined) {
          proxyReq.setHeader('X-Correlation-ID', ext.esqCorrelationId);
        }
      },
      error: (err) => {
        log.error({ err }, 'proxy upstream error');
      },
    },
  };
  return createProxyMiddleware(options) as unknown as RequestHandler;
}
