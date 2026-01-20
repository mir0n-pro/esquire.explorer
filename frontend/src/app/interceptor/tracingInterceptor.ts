/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
*/

import { HttpInterceptorFn } from '@angular/common/http';

export const tracingInterceptor: HttpInterceptorFn = (req, next) => {
  // Generate a unique ID for this specific request
  const requestId = crypto.randomUUID();

  const modifiedReq = req.clone({
    headers: req.headers
      .set('X-Request-ID', requestId)
      .set('X-Correlation-ID', requestId + '-CID')
      .set('X-Capture-Metrics', 'true')
  });

  return next(modifiedReq);
};
