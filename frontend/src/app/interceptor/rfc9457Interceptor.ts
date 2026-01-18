import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, Timestamp } from 'rxjs';

export const rfc9457Interceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let problem: ProblemDetails;

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        problem = {
          type: 'about:blank',
          title: 'Network Error',
          detail: error.error.message || error.message,
          status: error.status
        };
      } else if (error.status === 0) {
        // Gateway down / Connection refused / CORS issue
        problem = {
          type: 'about:blank',
          title: 'Server Unreachable',
          detail: 'Could not connect to the server. Please check your internet connection or try again later.',
          status: 0,
          instance: req.url
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

// rfc9457-problem.model.ts
export interface ProblemDetails {
  type: string;        // URI identifying the error type
  title: string;       // Short, human-readable summary
  status: number;     // HTTP status code
  detail?: string;     // Detailed, actionable explanation
  instance?: string;   // URI identifying the specific occurrence
  
  // Extension Members (Standardized across your services)
  traceId?: string;    // Correlation ID for backend logs
  errors?: Array<{     // Common extension for validation errors
    name?: string;
    reason: string;
    pointer?: string;  // JSON Pointer to the invalid field
  }>
  timestamp?:string;
  requestId?:string;
  correlationId?:string;
  processingTime?:string;
  stackTrace?:string;
}

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