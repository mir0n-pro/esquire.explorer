/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: traceMiddleware; X-Request-ID generated per request; X-Correlation-ID propagated only when client sets it (gateway is canonical)
 * 07/08/2026 mir0n  v1.2.11 -- the whole BFF tracing surface lives here: the OpenTelemetry engine
 *                   (initTracing / shutdownTracing, the OTLP exporter + sampler, and an IdGenerator that
 *                   seeds the root traceId from the settled CORRELATION id), the W3C helpers toW3cTraceId /
 *                   isW3cTraceId / generateW3cId / settleCorrelationId / buildTraceparent (kept in step with
 *                   the Java common.EsqUtils), and traceMiddleware. The BFF now settles the canonical
 *                   correlation id itself (kept when W3C-shaped, converted otherwise, else generated; the
 *                   request id is never a seed) and always exposes it on req.esqCorrelationId + the response.
 *                   A root SERVER span is opened only on a traced path -- isTracedPath() + TRACED_PREFIXES
 *                   (/api, /auth) -- so the BFF is the first hop of the trace for Esquire work; off them
 *                   (SPA shell, static assets, health probes) no span is created and req.esqTraceparent is a
 *                   plain traceparent carrying the correlation id. The ids are settled on EVERY request.
 *                   Off by default (esquire.tracing.enabled).
 * 07/09/2026 mir0n  v1.2.11 -- the tracer resource now carries service.instance.id, the INSTANCE_ID constant
 *                   in the Java <app>.<instanceNo> shape ('esq-backend.' + the host name's trailing ordinal
 *                   after the last dash when that tail is all digits, else 0 -- the EsqUtils.instanceNo()
 *                   rule). The collector rewrites service.name to it on the traces pipeline, so every BFF
 *                   span is badged with the replica that served the request.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { hostname } from 'node:os';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { SpanKind, type Tracer } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  type IdGenerator,
} from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { BackendConfig } from '../config.js';

const HDR_REQUEST_ID = 'x-request-id';
const HDR_CORRELATION_ID = 'x-correlation-id';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      esqRequestId: string;
      // The canonical, W3C-shaped correlation id the BFF settles and POSTS on every
      // request (like the request id). It equals the trace id the gateway extracts, so
      // the BFF's own log lines, the gateway/services, and the Tempo trace all share it.
      esqCorrelationId: string;
      // The W3C traceparent the BFF forwards to the gateway (T2.3). Its trace id
      // is settled from the SAME source the gateway settles the correlation id
      // from, so the gateway EXTRACTS this trace context (instead of minting one)
      // and the resulting span traceId == the settled Esq-Correlation-ID.
      esqTraceparent: string;
    }
  }
}

// --- W3C trace-id settlement, kept byte-identical to the Java common.EsqUtils so the trace id the
//     BFF seeds equals the correlation id the gateway settles from the same request/correlation id. ---

// SHA-256 of the value, first 16 bytes -> 32 lowercase hex (matches EsqUtils.toW3cTraceId).
function toW3cTraceId(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest().subarray(0, 16).toString('hex');
}

// 32 lowercase hex, not all zero (matches EsqUtils.isW3cTraceId).
function isW3cTraceId(value: string | undefined): boolean {
  return typeof value === 'string' && /^[0-9a-f]{32}$/.test(value) && !/^0{32}$/.test(value);
}

// A fresh W3C-shaped id (16 random bytes -> 32 lowercase hex, non-zero).
function generateW3cId(): string {
  let ret: string;
  do {
    ret = randomBytes(16).toString('hex');
  } while (/^0{32}$/.test(ret));
  return ret;
}

// Settle the correlation id: an incoming one wins (kept if W3C-shaped, else converted); otherwise a
// FRESH id is generated. The per-request id is NEVER a seed here -- the correlation id is its own
// identity (it, in turn, seeds the trace id). Mirrors EsqUtils.settleCorrelationId.
function settleCorrelationId(correlationId: string | undefined): string {
  let ret: string;
  if (correlationId !== undefined && correlationId.trim().length > 0) {
    ret = isW3cTraceId(correlationId) ? correlationId : toW3cTraceId(correlationId);
  } else {
    ret = generateW3cId();
  }
  return ret;
}

// A W3C traceparent carrying the given trace id: version 00, a fresh span id, sampled flag 01.
function buildTraceparent(traceId: string): string {
  return `00-${traceId}-${randomBytes(8).toString('hex')}-01`;
}

// --- OpenTelemetry engine -------------------------------------------------------------------------
// Emits a root server span per traced request, exported over OTLP to the collector, so the BFF appears
// as the first hop of the distributed trace (BFF -> gateway -> service). No-op (zero cost) when tracing
// is disabled: no provider is built and beginTrace() hands back the caller's fallback traceparent.

// The desired root trace id (== the settled correlation id) for the span about to be created. The
// IdGenerator reads it so the root span carries that id instead of a random one.
const traceIdSeed = new AsyncLocalStorage<string>();

// Seeds the root span's trace id from the correlation id when one is set for the current request;
// span ids stay random.
class EsqIdGenerator implements IdGenerator {
  generateTraceId(): string {
    return traceIdSeed.getStore() ?? randomBytes(16).toString('hex');
  }
  generateSpanId(): string {
    return randomBytes(8).toString('hex');
  }
}

let enabled = false;
let tracer: Tracer | undefined;
let provider: NodeTracerProvider | undefined;

// This instance's id in the Java <app>.<instanceNo> shape, computed ONCE (cached). Mirrors the Java
// EsqUtils.instanceNo() rule EXACTLY: the ordinal is the host name's tail AFTER THE LAST DASH, and only when
// that tail is all digits (esquire-backend-backend-1 -> 1); anything else -- including a docker container id
// that merely ends in digits (dd3376b3e076) -- has no ordinal and is instance 0. Emitted as the resource's
// service.instance.id, in step with the Java services: the collector rewrites service.name to it on the traces
// pipeline, so every BFF span is badged with the replica that served the request.
const INSTANCE_ID: string = 'esq-backend.' + (/-(\d+)$/.exec(hostname())?.[1] ?? '0');

// Wire the OTel SDK once at startup. No-op (zero cost) when tracing is disabled.
export function initTracing(config: BackendConfig): void {
  if (!config.tracing.enabled) {
    return;
  }
  const exporter = new OTLPTraceExporter({ url: config.tracing.otlpEndpoint });
  provider = new NodeTracerProvider({
    resource: new Resource({ 'service.name': 'esq-backend', 'service.instance.id': INSTANCE_ID }),
    idGenerator: new EsqIdGenerator(),
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(config.tracing.samplingRatio) }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });
  provider.register({ propagator: new W3CTraceContextPropagator() });
  tracer = provider.getTracer('esq-backend');
  enabled = true;
}

// Flush + close the exporter on shutdown so in-flight spans are not lost.
export async function shutdownTracing(): Promise<void> {
  if (provider !== undefined) {
    await provider.shutdown();
  }
}

interface RequestTrace {
  // The W3C traceparent to forward downstream. When tracing is on it carries the BFF span's real
  // context (so the gateway becomes its child); when off it is the caller-supplied fallback.
  traceparent: string;
  // End the BFF span (records the response status). No-op when tracing is off.
  finish: (statusCode: number) => void;
}

// Open the BFF's root span for a request. traceId is the settled correlation id; fallbackTraceparent
// is used verbatim when tracing is disabled. http.url carries the request path (matches the Java spans)
// so the collector can drop health-probe traces uniformly by path.
function beginTrace(traceId: string, fallbackTraceparent: string, method: string, path: string): RequestTrace {
  let ret: RequestTrace;
  if (enabled && tracer !== undefined) {
    // The span name carries no instance id: which BFF replica handled the request shows in the span's service
    // badge -- the collector rewrites service.name to service.instance.id on the traces pipeline -- so repeating
    // it in the name would only duplicate the badge (the Java spans drop it for the same reason).
    const span = traceIdSeed.run(traceId, () => tracer!.startSpan(`BFF ${method} ${path}`, { kind: SpanKind.SERVER }));
    span.setAttribute('http.request.method', method);
    span.setAttribute('http.url', path);
    const sc = span.spanContext();
    ret = {
      traceparent: `00-${sc.traceId}-${sc.spanId}-01`,
      finish: (statusCode: number) => {
        span.setAttribute('http.response.status_code', statusCode);
        span.end();
      },
    };
  } else {
    ret = { traceparent: fallbackTraceparent, finish: () => { /* no span when tracing is off */ } };
  }
  return ret;
}

// --- Trace scope --------------------------------------------------------------------------------
// Only ESQUIRE WORK opens a span: the API proxy to the gateway (/api/*) and the KeyCloak-backed
// sign-in routes (/auth/*). The SPA shell, its static assets and the health probes are served by
// the BFF but are not Esquire work -- spanning them fills the trace store with one root trace per
// asset load. Scoping is on the SPAN ONLY: the request / correlation ids are still settled and
// stamped on EVERY request, so every log line stays correlatable.
const TRACED_PREFIXES = ['/api', '/auth'];

export function isTracedPath(path: string): boolean {
  let ret = false;
  for (const prefix of TRACED_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      ret = true;
      break;
    }
  }
  return ret;
}

/**
 * Esquire tracing-header convention (services/doc, reference_tracing_headers.md):
 *   X-Request-ID     - one UUID per outbound HTTP from the Esquire client.
 *                      Client-generated; if absent here, the BFF generates one
 *                      so internal logs stay correlatable.
 *   X-Correlation-ID - the BFF settles it: an incoming one is kept when already
 *                      W3C-shaped and converted otherwise, else a fresh id is
 *                      generated. It is posted upstream as Esq-Correlation-ID,
 *                      and the gateway's RequestTraceFilter settles from it.
 *   traceparent      - W3C Trace Context carrying that same correlation id as
 *                      its trace id, so the trace and the log lines share ONE id.
 *
 * All are echoed on the response and exposed on req for downstream callers.
 * A SPAN is opened only for the traced paths (see isTracedPath); the ids are
 * settled for every request either way.
 */
export const traceMiddleware: RequestHandler = (req, res, next) => {
  const incomingRequestId = headerValue(req.headers[HDR_REQUEST_ID]);
  const incomingCorrelationId = headerValue(req.headers[HDR_CORRELATION_ID]);

  req.esqRequestId = incomingRequestId ?? randomUUID();
  // The BFF settles the canonical correlation id itself -- incoming or freshly generated, NEVER
  // derived from the per-request id -- and posts it, so its own log lines, the gateway/services, and
  // the trace all share ONE id (== traceId).
  const correlationId = settleCorrelationId(incomingCorrelationId);
  req.esqCorrelationId = correlationId;

  // Open the BFF's root span (traceId == correlationId) for Esquire work only; its context becomes
  // the downstream traceparent. Off the traced paths -- and whenever tracing is disabled -- a plain
  // traceparent carrying the correlation id is used and no span is created.
  const fallbackTraceparent = buildTraceparent(correlationId);
  if (isTracedPath(req.path)) {
    const trace = beginTrace(correlationId, fallbackTraceparent, req.method, req.path);
    req.esqTraceparent = trace.traceparent;
    res.on('finish', () => { trace.finish(res.statusCode); });
  } else {
    req.esqTraceparent = fallbackTraceparent;
  }

  res.setHeader('X-Request-ID', req.esqRequestId);
  res.setHeader('X-Correlation-ID', correlationId);

  next();
};

function headerValue(raw: string | string[] | undefined): string | undefined {
  let ret: string | undefined;
  if (Array.isArray(raw)) {
    ret = raw[0];
  } else if (typeof raw === 'string' && raw.length > 0) {
    ret = raw;
  }
  return ret;
}
