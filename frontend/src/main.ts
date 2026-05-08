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
* 05/07/2026 mir0n  v1.2.3 BFF migration: removed keycloak-js init; bootstrapApplication directly (BFF tier owns auth)
*/

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { RUNTIME_CONFIG } from './app/app.tokens';

const response = await fetch('/assets/config.json');
const config = await response.json();

await bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      ...(appConfig.providers || []),
      { provide: RUNTIME_CONFIG, useValue: config }
    ]
}).catch((err) => {
  console.error(err);
});
