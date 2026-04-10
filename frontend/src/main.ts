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
* 01/10/2026 mir0n complete keyCloak init withAutoRefreshToken
* 03/03/2026 claude checkLoginIframe: false (cross-port iframe unreliable with self-signed certs)
*/

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { RUNTIME_CONFIG } from './app/app.tokens';
import { AutoRefreshTokenService, INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, includeBearerTokenInterceptor, provideKeycloak, UserActivityService, withAutoRefreshToken } from 'keycloak-angular';

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
          },
          initOptions: {
            onLoad: 'check-sso',
            checkLoginIframe: false,
            pkceMethod: 'S256',       
            //flow: 'standard',
            silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`
            
          },
          features: [
            withAutoRefreshToken({
              sessionTimeout: 300000, // Optional: time in ms for inactivity logout
              onInactivityTimeout: 'logout' // What to do if the session actually dies
            })
          ],
           providers: [AutoRefreshTokenService, UserActivityService]
        }),
        ...(appConfig.providers || []),
        { provide: RUNTIME_CONFIG, useValue: config }
      ]
  }).catch((err) => { 
    console.error(err); 
  });
