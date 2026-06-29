/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 06/29/2026 mir0n  created: R1 client-side request timeout. Reads httpTimeoutMs from RUNTIME_CONFIG
*                   (assets/config.json); 0 / absent = no timeout (pre-HA default), so the request passes
*                   straight through. A positive value (local-k8s) bounds a hung request in the browser.
*/

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { timeout } from 'rxjs';
import { RUNTIME_CONFIG } from '../app.tokens';

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const ms = inject(RUNTIME_CONFIG).httpTimeoutMs ?? 0;
  return ms > 0 ? next(req).pipe(timeout(ms)) : next(req);
};
