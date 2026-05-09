# Release Report: v1.2.2 → v1.2.3

**Repo:** `esquire.explorer/develop`  
**Top commit:** `16e2ec8`

---

## Release Notes

### doc/release_notes.txt


**v1.2.3-2605.0722**  v1.2.3 BFF tier; SPA auth migrated from in-browser keycloak-js to cookie-backed BFF  
&nbsp;: Feature:     Backend-for-Frontend (BFF) tier under explorer/backend/  
&nbsp;                Express + openid-client v5; cookie session; OIDC code+PKCE  
&nbsp;                /auth/login, /callback, /logout, /me; /api/* proxy with bearer injection  
&nbsp;                dictionary cache (esq-kinds, esq-dictionary) per-process  
&nbsp;                baked SPA served from /app/public; per-request redirect_uri origin allowlist  
&nbsp;: Refactoring: SPA: keycloak-angular and keycloak-js removed  
&nbsp;                main.ts and app.config.ts no longer init Keycloak; auth state from /auth/me  
&nbsp;                app.tokens.ts: keycloak* fields removed from RuntimeConfig  
&nbsp;                app-shell.ts: bootstrapAuth() lazy-loads kinds/key only after authenticated  
&nbsp;: Fix:         tracingInterceptor: Math.random fallback when crypto.randomUUID is undefined  
&nbsp;                (non-secure-context origins like host.docker.internal:4200)  
&nbsp;                SPA cold-load no longer fires /api/esq-kinds before /auth/me confirmation  
&nbsp;                (eliminates 401 + PAGEERROR cascade on landing page)  
&nbsp;: Improvement: icon set refreshed (admin, client, merchant, sysadmin, unknown, $transfer)  
&nbsp;  Components:   backend (new), frontend  

---

## Code Changes

### backend/src/changes.txt

Esquire Frameworks(tm) 2.0  
Esquire Explorer (backend / BFF tier)  

**05/07/2026** mir0n  v1.2.3 created: Backend-for-Frontend tier  
&nbsp;**+ added src\index.ts**  
&nbsp;- BFF entrypoint; Express server; mounts /auth, /api proxy, baked SPA static, /readyz  
&nbsp;**+ added src\config.ts**  
&nbsp;- load BackendConfig from env vars: PUBLIC_BASE_URL, ALLOWED_ORIGINS,  
&nbsp;   KC_ISSUER/CLIENT_ID/CLIENT_SECRET, GATEWAY_URL, SESSION_SECRET, dict cache TTL  
&nbsp;**+ added src\auth\openidClient.ts**  
&nbsp;- openid-client v5 init via issuer discovery; cached singleton; getEndSessionUrl helper  
&nbsp;**+ added src\auth\routes.ts**  
&nbsp;- /auth/login, /callback, /logout, /me; OIDC code+PKCE flow  
&nbsp;- per-request redirect_uri resolved from Origin/Referer against allowedOrigins  
&nbsp;   (lets login work from either host.docker.internal:* or localhost:* in local k8s)  
&nbsp;**+ added src\auth\sessionStore.ts**  
&nbsp;- express-session middleware; HttpOnly + SameSite=Lax cookie  
&nbsp;- secure flag from nodeEnv; session shape: tokens, claims, pendingLogin  
&nbsp;**+ added src\auth\tokens.ts**  
&nbsp;- getValidAccessToken() with refresh-on-expiry via openid-client  
&nbsp;- NoSessionError sentinel for missing-session signalling to handlers  
&nbsp;**+ added src\proxy\apiProxy.ts**  
&nbsp;- /api/* server-to-server proxy to gateway; injects Bearer from session  
&nbsp;- cacheable GET path for /esq-kinds and /esq-dictionary; X-Request-ID propagation  
&nbsp;**+ added src\proxy\cache.ts**  
&nbsp;- in-memory dictionary cache; TTL + max-entries; key by path + sorted query  
&nbsp;- per-process (no cross-pod sync; intended for low-cardinality dict data)  
&nbsp;**+ added src\static\spa.ts**  
&nbsp;- serves baked Angular SPA from /app/public; SPA fallback to index.html for client-side routes  
&nbsp;**+ added src\util\log.ts**  
&nbsp;- pino logger + httpLogger; production JSON, development pretty  
&nbsp;**+ added src\util\trace.ts**  
&nbsp;- traceMiddleware; X-Request-ID generated per request  
&nbsp;- X-Correlation-ID propagated only when client sets it (gateway is canonical generator)  

### frontend/src/changes.txt


**05/07/2026** mir0n  v1.2.3 BFF migration: SPA delegates auth to BFF tier; eager kinds load gated on auth  
**app\app.component.ts**  
&nbsp;- keycloak-angular event handling removed (BFF tier owns auth)  
**app\app.config.ts**  
&nbsp;- keycloak-angular providers + includeBearerTokenInterceptor removed  
&nbsp;- auth handled by BFF cookie; only tracingInterceptor + rfc9457Interceptor remain  
**app\app.tokens.ts**  
&nbsp;- RuntimeConfig: keycloakUrl/keycloakRealm/keycloakClientId removed (BFF owns OIDC config)  
**app\interceptor\tracingInterceptor.ts**  
&nbsp;- newRequestId(): Math.random fallback when crypto.randomUUID is unavailable on  
&nbsp;   non-secure-context origins (e.g. host.docker.internal:4200 in local k8s)  
**explorer\flatTree\app-shell.ts**  
&nbsp;- bootstrapAuth() replaces keycloak-angular event signal; hits /auth/me to determine session state  
&nbsp;- lazy init: EsqObjectKindFactory.init() and acctItem.subItems setup deferred to authenticated branch  
&nbsp;- - avoids guaranteed 401 on /api/esq-kinds before login  
**explorer\flatTree\app-shell.html**  
&nbsp;- profile-menu trigger gated on isConnected(); standalone .profile-menu-button when unauthenticated  
**explorer\flatTree\app-shell.scss**  
&nbsp;- .profile-menu-button styles for unauthenticated standalone profile-menu trigger  
**main.ts**  
&nbsp;- keycloak-js init removed; bootstrapApplication directly (BFF tier owns auth)  
**public\assets\config.json (and .template)**  
&nbsp;- apiBasePath = "/api" (BFF same-origin, no absolute URL)  
&nbsp;- keycloakUrl/keycloakRealm/keycloakClientId removed (BFF owns OIDC config)  

---

## Commits

```

-- 2026-05-08 | commit: 16e2ec8 | mir0n.the.programmer | missed filed in merge --
A	frontend/public/img/ComponentModel.png
D	frontend/public/img/ComponentModel.svg
M	frontend/src/explorer/flatTree/app-shell.html
 3 files changed, 18 insertions(+), 13968 deletions(-)


-- 2026-05-08 | commit: 5a85f53 | mir0n.the.programmer | v1.2.3 BFF tier; SPA auth migrated from in-browser keycloak-js to cookie-backed BFF --
A	backend/.gitignore
A	backend/Dockerfile
A	backend/README.md
A	backend/compose.yaml
A	backend/docker-compose-build.bat
A	backend/package.json
A	backend/src/auth/openidClient.ts
A	backend/src/auth/routes.ts
A	backend/src/auth/sessionStore.ts
A	backend/src/auth/tokens.ts
A	backend/src/changes.txt
A	backend/src/config.ts
A	backend/src/index.ts
A	backend/src/proxy/apiProxy.ts
A	backend/src/proxy/cache.ts
A	backend/src/static/spa.ts
A	backend/src/util/log.ts
A	backend/src/util/trace.ts
A	backend/tsconfig.json
M	doc/release_notes.txt
A	e2e-test/e2e-k8s.bat
A	e2e-test/e2e-oci.bat
M	e2e-test/helpers/auth.ts
A	e2e-test/tests/99-debug-login.spec.ts
M	frontend/.dockerignore
M	frontend/Dockerfile
M	frontend/angular.json
M	frontend/compose.yaml
A	frontend/docker-compose-build.bat
M	frontend/package.json
A	frontend/proxy.conf.docker.json
A	frontend/proxy.conf.json
M	frontend/public/assets/config.json
M	frontend/public/assets/config.json.template
M	frontend/public/img/$transfer.ico
M	frontend/public/img/admin.ico
M	frontend/public/img/client.ico
M	frontend/public/img/merchant.ico
M	frontend/public/img/sysadmin.ico
M	frontend/public/img/unknown.ico
A	frontend/run-git.bat
A	frontend/run-local.bat
A	frontend/run-pkg.bat
A	frontend/run-yalc.bat
M	frontend/src/app/app.component.ts
M	frontend/src/app/app.config.ts
M	frontend/src/app/app.tokens.ts
M	frontend/src/app/interceptor/tracingInterceptor.ts
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/main.ts
M	frontend/src/rest/.openapi-generator/FILES
M	frontend/src/test/group3/ExplorerComponent.spec.ts
A	frontend/tsconfig.spec.app.json
A	frontend/tsconfig.spec.json
A	frontend/tsconfig.spec.ui.json
A	run.all.bat
A	run.backend.bat
A	run.frontend.bat
 61 files changed, 1608 insertions(+), 272 deletions(-)

-- 2026-05-03 | commit: 6c7c80b | mir0n.the.programmer | Update report_v1.2.2.md --
M	doc/reports/report_v1.2.2.md
 1 file changed, 45 insertions(+), 2 deletions(-)
```

---

## Files Modified

```
A	backend/.gitignore
A	backend/Dockerfile
A	backend/README.md
A	backend/compose.yaml
A	backend/docker-compose-build.bat
A	backend/package.json
A	backend/src/auth/openidClient.ts
A	backend/src/auth/routes.ts
A	backend/src/auth/sessionStore.ts
A	backend/src/auth/tokens.ts
A	backend/src/changes.txt
A	backend/src/config.ts
A	backend/src/index.ts
A	backend/src/proxy/apiProxy.ts
A	backend/src/proxy/cache.ts
A	backend/src/static/spa.ts
A	backend/src/util/log.ts
A	backend/src/util/trace.ts
A	backend/tsconfig.json
M	doc/release_notes.txt
M	doc/reports/report_v1.2.2.md
A	e2e-test/e2e-k8s.bat
A	e2e-test/e2e-oci.bat
M	e2e-test/helpers/auth.ts
A	e2e-test/tests/99-debug-login.spec.ts
M	frontend/.dockerignore
M	frontend/Dockerfile
M	frontend/angular.json
M	frontend/compose.yaml
A	frontend/docker-compose-build.bat
M	frontend/package.json
A	frontend/proxy.conf.docker.json
A	frontend/proxy.conf.json
M	frontend/public/assets/config.json
M	frontend/public/assets/config.json.template
M	frontend/public/img/$transfer.ico
A	frontend/public/img/ComponentModel.png
D	frontend/public/img/ComponentModel.svg
M	frontend/public/img/admin.ico
M	frontend/public/img/client.ico
M	frontend/public/img/merchant.ico
M	frontend/public/img/sysadmin.ico
M	frontend/public/img/unknown.ico
A	frontend/run-git.bat
A	frontend/run-local.bat
A	frontend/run-pkg.bat
A	frontend/run-yalc.bat
M	frontend/src/app/app.component.ts
M	frontend/src/app/app.config.ts
M	frontend/src/app/app.tokens.ts
M	frontend/src/app/interceptor/tracingInterceptor.ts
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/main.ts
M	frontend/src/rest/.openapi-generator/FILES
M	frontend/src/test/group3/ExplorerComponent.spec.ts
A	frontend/tsconfig.spec.app.json
A	frontend/tsconfig.spec.json
A	frontend/tsconfig.spec.ui.json
A	run.all.bat
A	run.backend.bat
A	run.frontend.bat
 64 files changed, 1671 insertions(+), 14242 deletions(-)
```

---

*From `v1.2.2` till `v1.2.3`*
