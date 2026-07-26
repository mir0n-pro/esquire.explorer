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
 * 07/17/2026 mir0n  esq_bff_inbound_duration_seconds (renamed from bff_http_request_duration_seconds, I48) plus
 *                   esq_bff_outbound_duration_seconds for the BFF->gateway hop (I42/L8+L9); the metrics surface
 *                   now reads its own metrics sub-switch, not tracing.enabled (I41).
 */

import type { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import type { BackendConfig } from '../config.js';

const register = new client.Registry();
let enabled = false;
let httpDuration: client.Histogram<'method' | 'route' | 'status'> | undefined;
let upstreamDuration: client.Histogram<'route' | 'outcome'> | undefined;

// How an upstream call ENDED. Bounded on purpose -- two values, so the label cannot grow a series per failure.
//   ok    -- the round-trip COMPLETED (any HTTP status). The status itself is the gateway's own SERVER metric's
//            business; this meter answers "how long did the BFF wait", not "what did the gateway answer".
//   error -- the call never completed: a network failure, a DNS miss, a proxy timeout. It HAS a duration too
//            (how long the BFF waited before giving up), so it must not vanish from the histogram.
export type UpstreamOutcome = 'ok' | 'error';

// A coarse route label -- the mounted base path (/auth, /api) or the first path segment -- so cardinality
// stays low (never the full /api/esq-... URL, which would explode into a series per entity id).
function routeLabel(req: Request): string {
  const base = (req.baseUrl && req.baseUrl.length > 0) ? req.baseUrl : '/' + (req.path.split('/')[1] ?? '');
  return base === '/' ? '/root' : base;
}

// Wire the Prometheus registry once at startup. No-op (zero cost) when the METRICS pillar is off
// (master off, or ESQ_METRICS_ENABLED=false while tracing stays on -- the per-pillar split, I41).
export function initMetrics(config: BackendConfig): void {
  if (!config.metrics.enabled) {
    return;
  }
  register.setDefaultLabels({ application: 'esq-backend' });
  client.collectDefaultMetrics({ register });   // process_* + nodejs_* (event-loop lag, GC, heap, handles)
  // NAMING (I48/d): the canonical names are esq.bff.inbound.duration / esq.bff.outbound.duration -- ONE esq.*
  // family across the whole system, Java fleet and BFF alike. They are spelled snake_case + _seconds HERE because
  // prom-client validates against /^[a-zA-Z_:][a-zA-Z0-9_:]*$/ and THROWS on a dot; these are exactly what
  // Micrometer renders those canonical names to, so both tiers land on identical series in Prometheus. Do not
  // "fix" these to dots -- the registry rejects them at startup.
  httpDuration = new client.Histogram({
    name: 'esq_bff_inbound_duration_seconds',
    help: 'BFF HTTP request duration in seconds, by method / coarse route / status.',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });
  upstreamDuration = new client.Histogram({
    name: 'esq_bff_outbound_duration_seconds',
    help: 'BFF upstream call duration in seconds -- the outbound leg to the gateway, by coarse route / outcome.',
    labelNames: ['route', 'outcome'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });
  enabled = true;
}

// Time ONE outbound call from the BFF to the gateway (I42/L8). Returns the stop function; call it with the
// outcome once the round-trip has ended. When the METRICS pillar is off the returned function is a no-op and no
// clock is read at all -- zero cost, the same posture as the rest of the umbrella.
//
// WHY THIS EXISTS (I42/L8): the BFF's own esq.bff.inbound.duration times the INBOUND request, and the
// gateway's esq.gw.outer times the gateway's work -- but nothing timed the step BETWEEN them, so the BFF<->gateway
// wire was the one hop in the whole REST collaboration with no number of its own. Its twin hop, gateway<->service,
// has one (the "in-cluster (gw <-> srv)" band = esq.gw.inner - esq.srv.outer). This closes that asymmetry.
// Subtract it from the inbound duration and the BFF's own overhead is what remains.
export function timeUpstream(req: Request): (outcome: UpstreamOutcome) => void {
  let ret: (outcome: UpstreamOutcome) => void;
  if (!enabled || upstreamDuration === undefined) {
    ret = () => { /* metrics pillar off -- no clock, no series */ };
  } else {
    const done = upstreamDuration.startTimer({ route: routeLabel(req) });
    // IDEMPOTENT -- the FIRST outcome wins and later calls are ignored. The streaming proxy path (L9) races
    // several terminal signals for one call: the upstream body's 'end', an upstream 'error', and the response's
    // 'close' -- and 'close' fires on EVERY response, right after a normal finish. Without this guard a perfectly
    // healthy proxied request would be counted TWICE: once as ok at 'end', then again as error at 'close'.
    // The guard lives here, not at the call site, so neither path can grow that bug later.
    let recorded = false;
    ret = (outcome: UpstreamOutcome) => {
      if (!recorded) {
        recorded = true;
        done({ outcome });
      }
    };
  }
  return ret;
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
