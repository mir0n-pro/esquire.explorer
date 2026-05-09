/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/30/2025 mir0n handle failure of RUNTIME_CONFIG injection
* 01/08/2026 mir0n includeBearerTokenInterceptor
*                  attempt to init keycloack
* 01/18/2026 mir0n added interceptors: tracingInterceptor, rfc9457Interceptor
* 05/07/2026 mir0n  v1.2.3 BFF migration: removed keycloak-angular providers + includeBearerTokenInterceptor; auth handled by BFF cookie
*/

import {ApplicationConfig, inject, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';

import {routes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {BASE_PATH} from "../rest";
import { RUNTIME_CONFIG} from './app.tokens';
import { rfc9457Interceptor } from './interceptor/rfc9457Interceptor';
import { tracingInterceptor } from './interceptor/tracingInterceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        tracingInterceptor,
        rfc9457Interceptor,
      ])
    ),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideZonelessChangeDetection(),
    {
      provide: BASE_PATH,
      useFactory: () => {
        const config = inject(RUNTIME_CONFIG);
        var s = config.apiBasePath;
        if (!s || s.includes('${')) {
            console.debug('path variables have not been replaced!!!: ', s);
            s = "/api";
          }
        return s;
      }
    }
  ]
};
