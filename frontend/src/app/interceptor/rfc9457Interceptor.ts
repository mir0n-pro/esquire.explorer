/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 01/19/2026 mir0n use ui\api\ProblemDetail.ts
* 01/24/2026 mir0n move ui package to esquire.ui
* 04/19/2026 mir0n import paths migrated to @mir0n-pro/esquire.ui library
* 07/02/2026 mir0n  a 401 redirects to /?auth=expired (session-expiry landing) and swallows the error (returns EMPTY)
*/

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  throwError,
  EMPTY,
  Timestamp,
} from 'rxjs';
import { ProblemDetail } from '@mir0n-pro/esquire.ui/api';

export const rfc9457Interceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Session gone at the BFF (no tokens, or the refresh token expired -> 401
      // {error:'no session'}). The app is already running but is no longer
      // authenticated, so every /api/* call now 401s. Bounce to the landing with the
      // auth=expired marker, which shows a "session expired -- please log in again"
      // notice rather than surfacing a dead error the user cannot act on. Cold load
      // is unaffected: lazy-auth defers /api/* until /auth/me confirms a session, and
      // /auth/me is a plain fetch that never reaches this interceptor -- so any 401
      // seen here is always an expired live session.
      if (error.status === 401) {
        window.location.href = '/?auth=expired';
        return EMPTY;
      }

      let problem: ProblemDetail;

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        problem = {
          type: 'about:blank',
          title: 'Network Error',
          detail: error.error.message || error.message,
          status: error.status,
          traceId: 'n\a'
        };
      } else if (error.status === 0) {
        // Gateway down / Connection refused / CORS issue
        problem = {
          type: 'about:blank',
          title: 'Server Unreachable',
          detail: 'Could not connect to the server. Please check your internet connection or try again later.',
          status: 0,
          instance: req.url,
          traceId: 'n\a'
        };
    } else {
        // Server-side error (RFC 9457 expected)
        // problem = error.error as ProblemDetails;
        //can be a problem with casting,  instanceof would not work do all manually
        // Server-side error - check if it's already an object (JSON)

        // Extract X-Request-ID from response headers if traceId isn't in the body
        const headerRequestId = error.headers.get('X-Request-ID');
        const headerCorrelationId = error.headers.get('Esq-Correlation-ID');

        const errorBody = (typeof error.error === 'object' && error.error !== null) ? error.error : {};
        problem = {
          // Trust the body (RFC 9457)
          // Fallback to the header (MDC sync) if body is empty
          traceId: errorBody.traceId || headerCorrelationId,
          type: errorBody.type || 'about:blank',
          title: errorBody.title || error.statusText || 'An unexpected error occurred',
          status: errorBody.status ?? error.status, // Use nullish coalescing for 0 status codes
          detail: errorBody.detail || (typeof error.error === 'string' ? error.error : error.message),
          instance: errorBody.instance || req.url,
          errors: errorBody.errors,
          timestamp: errorBody.timestamp|| new Date().toISOString(),
          requestId: errorBody.requestId || headerRequestId,
          correlationId: errorBody.correlationId || headerCorrelationId,
          processingTime: errorBody.processingTime,
          stackTrace: errorBody.stackTrace,
        };
      }

      // Action: Log to monitoring service with Trace ID
      if (problem.traceId || problem.requestId) {
        console.error(`[TraceID: ${problem.traceId} ${problem.requestId}] ${problem.title}: ${problem.detail} `);
      } else {
        console.error(`${problem.title}: ${problem.detail} `);
      }

      return throwError(() => problem);
    })
  );
};

/*
// user-profile.component.ts
this.userService.updateProfile(data).subscribe({
  error: (err: ProblemDetails) => {
    // Check for validation extension member
    if (err.type === 'https://api.example.com/probs/validation-error') {
      err.errors?.forEach(e => this.form.get(e.name)?.setErrors({ server: e.reason }));
    }
    this.errorMessage = err.detail || err.title;
  }
});
*/