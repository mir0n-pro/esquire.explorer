/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 01/08/2026 mir0n added keycloak params
* 05/07/2026 mir0n  v1.2.3 BFF migration: removed keycloakUrl/keycloakRealm/keycloakClientId from RuntimeConfig (BFF owns OIDC config)
* 06/29/2026 mir0n  added optional httpTimeoutMs to RuntimeConfig (R1 client-side request timeout)
*/

import { InjectionToken } from '@angular/core';

// This is for the full object fetched from /assets/config.json
export interface RuntimeConfig {
  apiBasePath: string;
  // R1 client-side request timeout (ms). 0 / absent = no client timeout (pre-HA default); a positive value
  // (set in the served config.json on local k8s) bounds a hung request in the browser.
  httpTimeoutMs?: number;
}
export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('runtime.config');
