import { InjectionToken } from '@angular/core';

// This is for the full object fetched from /assets/config.json
export interface RuntimeConfig {
  apiBasePath: string;
}
export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('runtime.config');


