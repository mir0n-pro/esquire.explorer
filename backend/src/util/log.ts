/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: pino logger + httpLogger; production JSON, development pretty
 * 07/07/2026 mir0n  httpLogger customProps: stamp each request line with requestId (esqRequestId) and
 *                   correlationId (esqCorrelationId when present), matching the ECS field names so the log
 *                   shipper cross-links the BFF edge to the service logs
 */

import { pino } from 'pino';
import pinoHttp from 'pino-http';

export const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export const httpLogger = pinoHttp({
  logger: log,
  customLogLevel: (_req, res, err) => {
    var ret: 'error' | 'warn' | 'info' = 'info';
    if (err || res.statusCode >= 500) {
      ret = 'error';
    } else if (res.statusCode >= 400) {
      ret = 'warn';
    }
    return ret;
  },
  // Cross-link the BFF request line to the downstream Java-service logs by the SAME ids:
  // requestId (the per-request X-Request-ID the BFF always sets in traceMiddleware) and
  // correlationId (present only when the client set X-Correlation-ID). Field names match the
  // ECS `requestId` / `correlationId` the services emit, so the log shipper extracts them
  // uniformly across the whole request path.
  customProps: (req) => {
    const r = req as unknown as { esqRequestId?: string; esqCorrelationId?: string };
    const ret: Record<string, string> = {};
    if (r.esqRequestId) {
      ret.requestId = r.esqRequestId;
    }
    if (r.esqCorrelationId) {
      ret.correlationId = r.esqCorrelationId;
    }
    return ret;
  },
});
