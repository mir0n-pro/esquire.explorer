/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/30/2025 mir0n handle failure of RUNTIME_CONFIG injection
*/



import {ApplicationConfig, inject, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import { provideHttpClient } from "@angular/common/http";
import {BASE_PATH} from "../rest";
import { RUNTIME_CONFIG} from './app.tokens';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideAnimationsAsync(), 
    provideHttpClient(),
    provideZonelessChangeDetection(),
    {
      provide: BASE_PATH,
      useFactory: () => {
        var s = "http://localhost:3000";
        try {
          const config = inject(RUNTIME_CONFIG);
          s = config.apiBasePath; // Extracts the string for OpenAPI services
          if (!s || s.includes('${')) {
            console.error('path variables have not been replaced!!!: ',s);
            s = "http://localhost:3000"; // Fallback if template placeholder not replaced
          }
        } catch (e) {
          console.error('RUNTIME_CONFIG injection failed, using default BASE_PATH', e);
        }
        return s;
      }
    }
  ]
};
