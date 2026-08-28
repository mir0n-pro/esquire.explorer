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
 * 08/26/2026 mir0n  pino redact drops cookie / set-cookie / authorization from every logged header bag; explicit req / res
 *                   serializers replace the pino-http defaults with a fixed field list (id, method, url, query,
 *                   remoteAddress, remotePort / statusCode)
 */

import { pino } from 'pino';
import pinoHttp from 'pino-http';

export const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  
redact: {
    paths: [
      'headers.cookie', 'headers["set-cookie"]', 'headers.authorization',
      '*.headers.cookie', '*.headers["set-cookie"]', '*.headers.authorization',
    ],
    remove: true,
  },
});

interface LoggedRequest {
  id?: unknown;
  method?: string;
  url?: string;
  query?: unknown;
  remoteAddress?: string;
  remotePort?: number;
}

interface LoggedResponse {
  statusCode?: number;
}

export const httpLogger = pinoHttp({
  logger: log,
  serializers: {
    req: (req: LoggedRequest) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res: LoggedResponse) => ({
      statusCode: res.statusCode,
    }),
  },
  customLogLevel: (_req, res, err) => {
    var ret: 'error' | 'warn' | 'info' = 'info';
    if (err || res.statusCode >= 500) {
      ret = 'error';
    } else if (res.statusCode >= 400) {
      ret = 'warn';
    }
    return ret;
  },

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
