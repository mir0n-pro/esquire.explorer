/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/30/2025 mir0n load config.json
*/

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { RUNTIME_CONFIG, RuntimeConfig } from './app/app.tokens';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

  fetch('/assets/config.json')
  .then(res => res.json())
  .then((config: RuntimeConfig) => {
    bootstrapApplication(AppComponent, {
      ...appConfig,
      providers: [
        ...(appConfig.providers || []),
        { provide: RUNTIME_CONFIG, useValue: config }
      ]
    });
  }).catch((err) => {
    console.error(err);
    bootstrapApplication(AppComponent, appConfig)
      .catch((err) => console.error(err));
    }
  );
