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
*/

import {ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
//import { authInterceptor, provideAuth } from 'angular-auth-oidc-client';
//import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {provideHttpClient, withInterceptors} from '@angular/common/http';

import {routes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {BASE_PATH} from "../rest";
import { RUNTIME_CONFIG} from './app.tokens';
import { INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, includeBearerTokenInterceptor, provideKeycloak, KeycloakService } from 'keycloak-angular';
import { rfc9457Interceptor } from './interceptor/rfc9457Interceptor';
import { tracingInterceptor } from './interceptor/tracingInterceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        tracingInterceptor,
        includeBearerTokenInterceptor,
        rfc9457Interceptor,
      ]) 
    ),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useFactory: () => {
        const config = inject(RUNTIME_CONFIG);
        // Define which URLs get the token (e.g., your API base path)
       var s = config.apiBasePath; // Extracts the string for OpenAPI services
        if (!s || s.includes('${')) {
            console.debug('path variables have not been replaced!!!: ',s);
            s = "http://localhost:3000"; // Fallback if template placeholder not replaced
        } 
        s = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters       
        return [
          {
            urlPattern: new RegExp(`^${s}/.*`, 'i'),
            httpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
          }
        ];
      }
    },

    
//xxx: unable to init keycloak dynamically, within appConfig providers, let have it in main.ts 
//     until the issue is solved by angular/keycloak-angular team
/*   
// dummy config to allow initialization
    provideKeycloak({
      config: {
        url: '', 
        realm: '',
        clientId: ''
      }
    }),
    //real config initializer
    provideAppInitializer(async () => {
      const keycloakService = inject(KeycloakService); // Use the service here
      const config = inject(RUNTIME_CONFIG);
      await keycloakService.init({
        config: {
          url: config.keycloakUrl,
          realm: config.keycloakRealm,
          clientId: config.keycloakClientId,
          grant_type:'password', 
          scope: 'openid profile email'
        },
        initOptions: {
          //onLoad: 'check-sso',
          onLoad: 'login-required',
          checkLoginIframe: false, 
          pkceMethod: 'S256'        
          //flow: 'standard',
          //silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`
        }
      });
    }),
  */  
    provideRouter(routes), 
    provideAnimationsAsync(),
    provideZonelessChangeDetection(),
    {
      provide: BASE_PATH,
      useFactory: () => {
        const config = inject(RUNTIME_CONFIG);
        var s = config.apiBasePath; // Extracts the string for OpenAPI services
        if (!s || s.includes('${')) {
            console.debug('path variables have not been replaced!!!: ',s);
            s = "http://localhost:3000"; // Fallback if template placeholder not replaced
          }
        return s;
      }
    }
  ]
};
