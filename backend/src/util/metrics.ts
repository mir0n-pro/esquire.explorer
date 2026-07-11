/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 07/10/2026 mir0n  created: the BFF Prometheus metrics surface (v1.2.11 O1/T5c). prom-client is the Node
 *                   bridge to the same PULL model the Java services use (a /metrics endpoint scraped by
 *                   Prometheus, not the OTLP push the tracing uses). initMetrics() registers the Node runtime
 *                   defaults (process CPU/memory, event-loop lag, GC, heap -- the Node analog of the JVM
 *                   binders) plus a BFF HTTP request-duration histogram; metricsMiddleware() times each
 *                   request; metricsHandler() serves /metrics. Every series carries application="esq-backend"
 *                   (matching the Java common tag) so the dashboard groups it the same way. Gated by the
 *                   observability umbrella (config.tracing.enabled, fed from ESQ_OBSERVABILITY_ENABLED) --
 *                   off by default = zero cost.
 */

import type { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import type { BackendConfig } from '../config.js';

const register = new client.Registry();
let enabled = false;
let httpDuration: client.Histogram<'method' | 'route' | 'status'> | undefined;

// A coarse route label -- the mounted base path (/auth, /api) or the first path segment -- so cardinality
// stays low (never the full /api/esq-... URL, which would explode into a series per entity id).
function routeLabel(req: Request): string {
  const base = (req.baseUrl && req.baseUrl.length > 0) ? req.baseUrl : '/' + (req.path.split('/')[1] ?? '');
  return base === '/' ? '/root' : base;
}

// Wire the Prometheus registry once at startup. No-op (zero cost) when observability is disabled.
export function initMetrics(config: BackendConfig): void {
  if (!config.tracing.enabled) {
    return;
  }
  register.setDefaultLabels({ application: 'esq-backend' });
  client.collectDefaultMetrics({ register });   // process_* + nodejs_* (event-loop lag, GC, heap, handles)
  httpDuration = new client.Histogram({
    name: 'bff_http_request_duration_seconds',
    help: 'BFF HTTP request duration in seconds, by method / coarse route / status.',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });
  enabled = true;
}

// Time each request and record it on finish. Skips the /metrics scrape itself so the histogram measures real
// traffic, not Prometheus polling.
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!enabled || !httpDuration || req.path === '/metrics') {
    next();
    return;
  }
  const done = httpDuration.startTimer({ method: req.method });
  res.on('finish', () => {
    done({ route: routeLabel(req), status: String(res.statusCode) });
  });
  next();
}

// Serve the Prometheus text exposition. 404 when observability is off (the endpoint is inert, like the Java
// services' /actuator/prometheus when the registry is absent).
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  if (!enabled) {
    res.status(404).end();
    return;
  }
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
