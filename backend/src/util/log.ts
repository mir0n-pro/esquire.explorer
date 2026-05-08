/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: pino logger + httpLogger; production JSON, development pretty
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
});
