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
