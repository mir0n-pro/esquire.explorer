# Release Report: v1.2.9 → v1.2.10

**Repo:** `esquire.explorer/develop`  
**Top commit:** `807786c`

---

## Release Notes

### doc/release_notes.txt


**v1.2.10-2607.0416**  v1.2.10 -- e2e: tree navigation hardened for two-copy / remote runs  
&nbsp;: Fix:         e2e tree navigation now waits for the path bar to show the just-selected node  
&nbsp;   Components:   e2e  

**v1.2.10-2607.0300**  v1.2.10 -- collected-backlog fixes  
&nbsp;- session-expiry redirect + pre-empt  
&nbsp;- frontend debug logging routed through EsqUtils.log  
&nbsp;- KCEsquire reconcile utility (hauberk kc-reconcile)  
&nbsp;- hauberk write-time X-Request-ID companion  
&nbsp;- e2e: self-contained Test House fixtures; session-expiry + login-cancel specs; cold-start retry/timeout hardening  
&nbsp;   Components:   backend,  
&nbsp;                 frontend,  
&nbsp;                 hauberk,  
&nbsp;                 e2e  

**v1.2.10-2606.2910**  v1.2.10 -- request timeouts across the explorer + a load-test for the query cap  
&nbsp;: Feature:     the backend can bound how long it waits on a slow incoming request and on a stuck call  
&nbsp;                 to the gateway; both off by default, set on local k8s  
&nbsp;: Feature:     the web app can bound how long the browser waits on a slow request; off by default  
&nbsp;: Config:      the backend now finds Keycloak through a separate internal address when one is set, so it  
&nbsp;                 reaches it inside the cluster while the browser keeps using the public address  
&nbsp;: Feature:     hauberk: a smoke run that checks the database query-time cap -- a capped slow query is  
&nbsp;                 cancelled at the cap while an opt-out slow query (a move / cache load) still completes  
&nbsp;   Components:   backend,  
&nbsp;                 frontend,  
&nbsp;                 hauberk  

**v1.2.10-2606.2722**  v1.2.10 -- BFF shared login sessions (run more than one backend copy)  
&nbsp;: Feature:     the backend keeps each login session in a shared store (Redis) when configured;  
&nbsp;                 left unset it keeps sessions in memory and runs as a single copy  
&nbsp;   Components:   backend  

---

## Code Changes

### backend/src/changes.txt


**07/03/2026** mir0n  v1.2.10 -- session-expiry redirect + pre-empt  
**src\auth\routes.ts**  
&nbsp;- session-expiry: callback stores session_expires_at; /auth/me returns sessionExpiresAt and reports authenticated:false once the refresh-token window has passed  
**src\auth\sessionStore.ts**  
&nbsp;- OidcTokens gains session_expires_at (epoch ms of the refresh-token window) for the session-expiry pre-empt  
**src\auth\tokens.ts**  
&nbsp;- refreshExpiresAt(tokenSet) = now + refresh_expires_in; a refresh carries session_expires_at forward  

**06/29/2026** mir0n  v1.2.10 BFF R1 request-path timeouts + internal KC discovery URL  
**src\config.ts**  
&nbsp;- added kc.issuerInternal (KC_ISSUER_INTERNAL env, defaults to issuer); added server.requestTimeoutMs  
&nbsp;   (BFF_REQUEST_TIMEOUT_MS) + proxy.timeoutMs (BFF_PROXY_TIMEOUT_MS), both default 0  
**src\auth\openidClient.ts**  
&nbsp;- discover through config.kc.issuerInternal (server-to-server reachable) instead of the public issuer;  
&nbsp;   log discovered issuer + authorization/token endpoints  
**src\index.ts**  
&nbsp;- set server.requestTimeout from config.server.requestTimeoutMs when > 0 (R1; 0 leaves Node's default)  
**src\proxy\apiProxy.ts**  
&nbsp;- set proxyTimeout from config.proxy.timeoutMs when > 0 (R1; 0 omits it)  

**06/27/2026** mir0n  v1.2.10 BFF shared session store (connect-redis) for multi-replica  
**src\config.ts**  
&nbsp;- added session.redisUrl from REDIS_URL env (default empty) -- shared session store endpoint  
**src\auth\sessionStore.ts**  
&nbsp;- session store selectable -- buildSessionStore() returns connect-redis RedisStore (prefix esq.sess:)  
&nbsp;   when session.redisUrl set, else express-session MemoryStore  
**package.json**  
&nbsp;- added dependencies connect-redis ^9.0.0 and redis ^6.0.1  

### frontend/src/changes.txt


**07/03/2026** mir0n  v1.2.10 -- session-expiry landing + frontend debug-log tweak  
**app\interceptor\rfc9457Interceptor.ts**  
&nbsp;- a 401 redirects to /?auth=expired (session-expiry landing) and swallows the error (returns EMPTY)  
**explorer\flatTree\app-shell.ts**  
&nbsp;- session-expiry: sessionExpired signal + '?auth=expired' marker (shown then stripped in ngOnInit); scheduleSessionPreempt / onSessionPreempt re-check /auth/me and redirect on real expiry; ngOnDestroy clears the timer  
**explorer\flatTree\app-shell.html**  
&nbsp;- session-expired landing notice  
**explorer\flatTree\app-shell.scss**  
&nbsp;- .session-expired-notice styling  
**app\app.config.ts**  
&nbsp;- BASE_PATH fallback logs via EsqUtils.log (was console.debug)  

**06/29/2026** mir0n  v1.2.10 R1 client-side request timeout  
**interceptor\timeoutInterceptor.ts  (new)**  
&nbsp;- reads httpTimeoutMs from RUNTIME_CONFIG (assets/config.json); 0 / absent = pass through (pre-HA  
&nbsp;   default), a positive value bounds a hung request in the browser  
**app.config.ts**  
&nbsp;- registered timeoutInterceptor in the HTTP interceptor chain  
**app.tokens.ts**  
&nbsp;- added optional httpTimeoutMs to RuntimeConfig (R1 client-side request timeout)  
**public\assets\config.json**  
&nbsp;- added "httpTimeoutMs": 0 (pre-HA default; baked into the image)  
**public\assets\config.json.template**  
&nbsp;- added "httpTimeoutMs": 0  

### hauberk/changes.txt


**07/03/2026** mir0n  v1.2.10 -- KCEsquire reconcile utility; write-time X-Request-ID companion  
cli.KcReconcileCommand  (new)  
&nbsp;- picocli "kc-reconcile" subcommand -- detect (and optionally --repair) drift between esq2025 and KeyCloak, PG(JDBC) + KC(REST) directly, out of the Esquire services  
reconcile.KcRecover  (new)  
&nbsp;- KCEsquire data-recover core: reads connected-user state from esq2025 over PG/JDBC + KeyCloak over REST admin; diffs and (repair mode) fixes a stale KC esq_rootpath in place  
**cli.HauberkCli**  
&nbsp;- registered the kc-reconcile subcommand  
**config.HauberkConfig**  
&nbsp;- added PG_URL / PG_USER / PG_PASSWORD (pg.url / pg.user / pg.password) for the kc-reconcile utility's direct JDBC read of esq2025  
**simulations.HauberkSimulation**  
&nbsp;- every outbound request carries a fresh X-Request-ID (UUID) so hauberk writes satisfy the services' write-time X-Request-ID guard  
**pom.xml**  
&nbsp;- added org.postgresql:postgresql (JDBC driver for kc-reconcile)  
**hauberk.properties**  
&nbsp;- pg.url / pg.user / pg.password (kc-reconcile, docker: localhost:5432/esq2025)  
**hauberk-k8s.properties**  
&nbsp;- pg.url (kc-reconcile, local k8s: port-forward localhost:25432)  

**06/29/2026** mir0n  v1.2.10 -- R6 query-timeout HA smoke  
simulations.HaTimeoutSmokeSimulation  (new)  
&nbsp;- hits enyMan's flag-gated /test slow-query hook directly (not via the gateway): a capped slow query  
&nbsp;   (/test/slow-query) is cancelled at the cap (timedOut=true); an opt-out slow query  
&nbsp;   (/test/slow-query-optout, the move / cache-load mechanism) completes (timedOut=false)  
**config.HauberkConfig**  
&nbsp;- added ENYMAN_BASE (enyman.base, required) -- enyMan reached directly for the R6 timeout smoke  
**hauberk.properties**  
&nbsp;- added enyman.base=http://localhost:3003 (enyMan's own port; compose exposes 3003, local k8s port-forward)  

---

## Commits

```

-- 2026-07-04 | commit: 807786c | mir0n.the.programmer | v1.2.10 -- version finalizing --
M	README.md
M	frontend/public/img/ComponentModel.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/why-it-matters.html
 4 files changed, 33 insertions(+), 9 deletions(-)

-- 2026-07-04 | commit: e8ba46c | mir0n.the.programmer | v1.2.10 -- e2e: tree navigation hardened for two-copy / remote runs --
M	doc/release_notes.txt
M	e2e-test/helpers/tree.ts
 2 files changed, 18 insertions(+), 1 deletion(-)

-- 2026-07-03 | commit: 9820bf1 | mir0n.the.programmer | v1.2.10 -- collected-backlog fixes --
M	backend/src/auth/routes.ts
M	backend/src/auth/sessionStore.ts
M	backend/src/auth/tokens.ts
M	backend/src/changes.txt
M	backend/test/auth/tokens.test.ts
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
M	e2e-test/helpers/auth.ts
A	e2e-test/helpers/testHouse.ts
M	e2e-test/helpers/tree.ts
M	e2e-test/playwright.config.ts
M	e2e-test/tests/08-new-entity.spec.ts
M	e2e-test/tests/11-deposit.spec.ts
A	e2e-test/tests/16-session-expiry.spec.ts
A	e2e-test/tests/17-login-cancel.spec.ts
M	frontend/src/app/app.config.ts
M	frontend/src/app/interceptor/rfc9457Interceptor.ts
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/explorer/flatTree/app-shell.ts
M	hauberk/changes.txt
M	hauberk/hauberk-k8s.properties
M	hauberk/hauberk.properties
M	hauberk/pom.xml
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/HauberkCli.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/KcReconcileCommand.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/reconcile/KcRecover.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HauberkSimulation.java
 30 files changed, 903 insertions(+), 76 deletions(-)

-- 2026-06-29 | commit: 99c3794 | mir0n.the.programmer | v1.2.10 -- request timeouts across the explorer + a load-test for the query cap --
M	backend/src/auth/openidClient.ts
M	backend/src/changes.txt
M	backend/src/config.ts
M	backend/src/index.ts
M	backend/src/proxy/apiProxy.ts
M	doc/release_notes.txt
D	e2e-test/test-results/.last-run.json
M	frontend/package-lock.json
M	frontend/public/assets/config.json
M	frontend/public/assets/config.json.template
M	frontend/src/app/app.config.ts
M	frontend/src/app/app.tokens.ts
A	frontend/src/app/interceptor/timeoutInterceptor.ts
M	frontend/src/changes.txt
M	hauberk/changes.txt
M	hauberk/hauberk.properties
A	hauberk/k8s-smoke.bat
A	hauberk/smoke-5.bat
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HaTimeoutSmokeSimulation.java
 20 files changed, 208 insertions(+), 18 deletions(-)

-- 2026-06-27 | commit: b831c4b | mir0n.the.programmer | v1.2.10 -- BFF shared login sessions (run more than one backend copy) --
M	backend/package-lock.json
M	backend/package.json
M	backend/src/auth/sessionStore.ts
M	backend/src/changes.txt
M	backend/src/config.ts
M	backend/test/config.test.ts
M	doc/release_notes.txt
M	e2e-test/package.json
M	hauberk/hauberk-k8s.properties
 9 files changed, 209 insertions(+), 19 deletions(-)

-- 2026-06-25 | commit: 14bab5b | mir0n.the.programmer | v1.2.10 -- version bump --
M	backend/package.json
M	frontend/package.json
M	hauberk/pom.xml
 3 files changed, 3 insertions(+), 3 deletions(-)

-- 2026-06-25 | commit: 6118920 | mir0n.the.programmer | Create report_v1.2.9.md --
A	doc/reports/report_v1.2.9.md
 1 file changed, 116 insertions(+)
```

---

## Files Modified

```
M	README.md
M	backend/package-lock.json
M	backend/package.json
M	backend/src/auth/openidClient.ts
M	backend/src/auth/routes.ts
M	backend/src/auth/sessionStore.ts
M	backend/src/auth/tokens.ts
M	backend/src/changes.txt
M	backend/src/config.ts
M	backend/src/index.ts
M	backend/src/proxy/apiProxy.ts
M	backend/test/auth/tokens.test.ts
M	backend/test/config.test.ts
M	doc/release_notes.txt
A	doc/reports/report_v1.2.9.md
M	e2e-test/e2e-test.scope.md
M	e2e-test/helpers/auth.ts
A	e2e-test/helpers/testHouse.ts
M	e2e-test/helpers/tree.ts
M	e2e-test/package.json
M	e2e-test/playwright.config.ts
D	e2e-test/test-results/.last-run.json
M	e2e-test/tests/08-new-entity.spec.ts
M	e2e-test/tests/11-deposit.spec.ts
A	e2e-test/tests/16-session-expiry.spec.ts
A	e2e-test/tests/17-login-cancel.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/assets/config.json
M	frontend/public/assets/config.json.template
M	frontend/public/img/ComponentModel.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/app/app.config.ts
M	frontend/src/app/app.tokens.ts
M	frontend/src/app/interceptor/rfc9457Interceptor.ts
A	frontend/src/app/interceptor/timeoutInterceptor.ts
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/explorer/flatTree/app-shell.ts
M	hauberk/changes.txt
M	hauberk/hauberk-k8s.properties
M	hauberk/hauberk.properties
A	hauberk/k8s-smoke.bat
M	hauberk/pom.xml
A	hauberk/smoke-5.bat
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/HauberkCli.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/KcReconcileCommand.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/reconcile/KcRecover.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HaTimeoutSmokeSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HauberkSimulation.java
 53 files changed, 1490 insertions(+), 126 deletions(-)
```

---

*From `v1.2.9` till `v1.2.10`*
