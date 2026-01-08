/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 01/08/2026 mir0n added keycloak params
*/

import { InjectionToken } from '@angular/core';

// This is for the full object fetched from /assets/config.json
export interface RuntimeConfig {
  apiBasePath: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
}
export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('runtime.config');


