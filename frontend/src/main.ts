/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/30/2025 mir0n load config.json
* 01/08/2026 mir0n assets/config.json is required
*                  added keyclock init (unfortunately you cannod do it within app.config.ts )
*/

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { RUNTIME_CONFIG } from './app/app.tokens';
import { INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, includeBearerTokenInterceptor, provideKeycloak } from 'keycloak-angular';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideZonelessChangeDetection } from '@angular/core';
import { BASE_PATH } from './rest';

  const response = await fetch('/assets/config.json');
  const config = await response.json();

  // 2. Bootstrap with the dynamic config
  await bootstrapApplication(AppComponent, {
      ...appConfig,
      providers: [
//xxx: unable to init keycloak dynamically, within appConfig providers, so doing it here

        provideKeycloak({
          config: {
            url: config.keycloakUrl?? "http://localhost:8080", 
            realm: config.keycloakRealm?? "esquire",
            clientId: config.keycloakClientId?? "esq-angular",
            grant_type:'password', 
            scope: 'openid profile email'  
          },
          initOptions: {
            //onLoad: 'check-sso',
            onLoad: 'login-required',
            checkLoginIframe: false, 
            pkceMethod: 'S256',       
            //flow: 'standard',
            //silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`
          }
        }),
        ...(appConfig.providers || []),
        { provide: RUNTIME_CONFIG, useValue: config }
      ]
  }).catch((err) => { 
    console.error(err); 
  });
