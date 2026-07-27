# Release Report: v1.2.10 → v1.2.11

**Repo:** `esquire.explorer/develop`  
**Top commit:** `fe78254`

---

## Release Notes

### doc/release_notes.txt


**v1.2.11-2607.2714**  v1.2.11 -- Finalization  
&nbsp;- the cloud end-to-end launchers now point the token-relay checks at the cloud gateway (where the  
&nbsp;     relay is intentionally off, so the checks skip) instead of silently testing a local gateway  
&nbsp;- the dead-session recovery check now waits for the tree to finish loading before it simulates the  
&nbsp;     dead session, so the expiry is triggered reliably instead of racing the tree's own first load  
&nbsp;   Components:   e2e  

**v1.2.11-2607.2616**  v1.2.11 -- T13: landing pages + README refreshed  
&nbsp;: Doc:         the About/landing Architecture tab gains the Observability Stack (its components, as on the  
&nbsp;                 services README); the other tabs gain a mature-framework message -- the goal met, the fifteen  
&nbsp;                 factors, high availability and full observability  
&nbsp;: Doc:         the README carries the v1.2.11 observability announcement, with the prior version rolled down  
&nbsp;   Components:   frontend  

**v1.2.11-2607.2318**  v1.2.11 -- homework: fixes noted during the audit  
&nbsp;- the browser-tier login secrets now fail closed instead of falling back to a built-in dev value  
&nbsp;- a post-login redirect is confined to the app's own address, so a crafted link cannot bounce a signed-in user elsewhere  
&nbsp;   Components:   backend  

**v1.2.11-2607.1910**  v1.2.11 -- T12: the OKE performance matrix  
&nbsp;- the performance matrix can now run on the live cloud cluster, switching monitoring on and off in place  
&nbsp;     instead of tearing the whole environment down and rebuilding it each time  
&nbsp;   Components:   hauberk  

**v1.2.11-2607.1714**  v1.2.11 -- T11 cleanup: fix/resolve issues noted during development  
&nbsp;- the browser tier's own metric names did not match the naming used everywhere else  
&nbsp;- the hop from the browser tier out to the gateway had no timing of its own  
&nbsp;- the browser tier's calls to the login server did not show up in the trace  
&nbsp;- the browser tier could not turn tracing and metrics on independently  
&nbsp;- the performance matrix measured the monitoring cost as one lump and could not separate out logging  
&nbsp;   Components:   backend,  
&nbsp;                 hauberk  

**v1.2.11-2607.1513**  v1.2.11 -- T11 cleanup: fix/resolve issues noted during development  
&nbsp;- the browser tier read the wrong observability switch and stayed dark on the cluster  
&nbsp;- the gateway's token relay was enabled but exercised by no test  
&nbsp;   Components:   backend,  
&nbsp;                 e2e,  
&nbsp;                 hauberk  

**v1.2.11-2607.1413**  v1.2.11 -- hauberk: a performance matrix that measures the load-test results across every environment  
&nbsp;: Feature:     a performance matrix -- one command measures every environment (docker, one copy of each service,  
&nbsp;                 two copies, each with and without observability) on the same machine, rebuilding everything from  
&nbsp;                 scratch each time so no run inherits the last one's data, and prints what each choice costs  
&nbsp;: Fix:         a simulated user whose setup step failed used to carry on into its loop with nothing to work  
&nbsp;                 with, so it sent no requests at all and spun at full speed doing nothing -- 3.5 million such  
&nbsp;                 errors in one 60-second run, quietly holding down every throughput figure we measured  
&nbsp;: Fix:         the read and update scenarios were drawing users from the same office the create-and-delete  
&nbsp;                 scenario churns, so they kept asking for people who had just been deleted and counted the answer  
&nbsp;                 as a failure of the system  
&nbsp;: Fix:         the load runs reached the cluster through a port-forward -- a single-threaded relay that was  
&nbsp;                 capping every figure we took from it; they now go through the ingress, as the rest of the tests do  
&nbsp;   Components:   hauberk  

**v1.2.11-2607.1120**  v1.2.11 -- e2e: the login-identity path is finally covered, roles included  
&nbsp;: Feature:     a new end-to-end test switches a user's login access on, changes what they are allowed to do,  
&nbsp;                 and switches it off again -- driving the whole identity chain through to the login server for  
&nbsp;                 real, in the order the system actually requires  
&nbsp;: Feature:     the repeating activity run does the same on every lap, so the identity path is exercised under  
&nbsp;                 sustained use, not only once  
&nbsp;: Fix:         none of that was covered before: the existing access-profile test only opened and closed the  
&nbsp;                 dialog without ever saving, and NOTHING anywhere changed a user's permissions -- so a  
&nbsp;                 permission the system had revoked could have quietly remained in force at the login server  
&nbsp;                 and every test would still have passed  
&nbsp;   Components:   e2e  

**v1.2.11-2607.1019**  v1.2.11 -- observability: the login backend publishes its own live measurements  
&nbsp;: Feature:     the login backend (BFF) now publishes its own live measurements -- request rates and response  
&nbsp;                 times, memory and event-loop health -- to the same metrics dashboard as the services  
&nbsp;: Config:      off by default; turns on with the same observability switch as request tracing  
&nbsp;: Feature:     a full-lifecycle activity job runs the create-user / connect / deposit / withdraw / remove cycle  
&nbsp;                 through the browser under the Test House, N times, to exercise every service and light up the  
&nbsp;                 dashboard and traces end to end  
&nbsp;   Components:   backend,  
&nbsp;                 e2e  

**v1.2.11-2607.0920**  v1.2.11 -- observability: traces name the login backend copy that served the request  
&nbsp;: Feature:     the login backend (BFF) reports which copy of itself handled a request, so every traced  
&nbsp;                 step is labelled with the copy that ran it  
&nbsp;   Components:   backend  

**v1.2.11-2607.0813**  v1.2.11 -- observability: request tracing in the login backend  
&nbsp;: Feature:     the login backend (BFF) joins the request timeline -- it opens the timeline for a data or  
&nbsp;                 sign-in request and passes it on, so the request can be followed from the browser through  
&nbsp;                 the gateway and on to the services  
&nbsp;: Feature:     the login backend settles one id per request and sends it upstream, so its own log lines,  
&nbsp;                 the other services' log lines, and the request's timeline all carry the same id  
&nbsp;: Feature:     only data and sign-in requests are timed; page files and health checks are left out  
&nbsp;: Config:      tracing added to the login backend, off by default  
&nbsp;   Components:   backend  

**v1.2.11-2607.0701**  v1.2.11 -- the login backend tags its logs with the request id  
&nbsp;: Feature:     the login backend (BFF) now stamps each log line with the request id (and the correlation  
&nbsp;                 id when the client set one), so its logs line up with the other services' logs for the same  
&nbsp;                 request in the shared log viewer  
&nbsp;: Fix:         the login backend's container image builds reliably again -- leftover files from the host  
&nbsp;                 no longer leak into the image (added a build-ignore file at the image build root)  
&nbsp;   Components:   backend  

**v1.2.11-2607.0615**  v1.2.11 -- session-expired notice keeps the login button visible and scrolls for attention  
&nbsp;: Fix:         on the session-expired landing the notice no longer pushes the Log-in button off the toolbar -- both stay visible  
&nbsp;: Feature:     the session-expired notice now scrolls across to draw attention (held still for reduced-motion)  
&nbsp;   e2e 16-session-expiry asserts the login button stays in the toolbar when the notice shows  
&nbsp;   Components:   frontend,  
&nbsp;                 e2e  

**v1.2.11-2607.0600**  v1.2.11 -- e2e: Details dialog Esc-close coverage  
&nbsp;   e2e 18-details-esc-focus asserts the Details dialog on a seeded admin (Test House / Test Driver) closes on a single Esc, with focus landing inside the dialog on open  
&nbsp;   Components:   e2e  

---

## Code Changes

### backend/src/changes.txt


**07/23/2026** mir0n  v1.2.11 -- homework: fix/resolve issues noted during the audit  
**src\config.ts**  
&nbsp;- KC_CLIENT_SECRET and SESSION_SECRET fail CLOSED: required() with no dev fallback (missing secret crashes boot)  
**src\auth\routes.ts**  
&nbsp;- safeReturnTo(): post-login returnTo constrained to the callback origin (open-redirect / CWE-601 guard)  

**07/17/2026** mir0n  v1.2.11 -- T11 cleanup: fix/resolve issues noted during development  
**src\util\metrics.ts**  
&nbsp;- esq_bff_inbound_duration_seconds (renamed from bff_http_request_duration_seconds, I48) plus  
&nbsp;   esq_bff_outbound_duration_seconds for the BFF->gateway hop (I42/L8+L9); the metrics surface now reads its own  
&nbsp;   metrics sub-switch, not tracing.enabled (I41)  
**src\util\trace.ts**  
&nbsp;- traceKcCall(name, fn) opens a CLIENT span around a KeyCloak round-trip; toW3cTraceId / isW3cTraceId are  
&nbsp;   exported for the cross-language W3C conformance test  
**src\proxy\apiProxy.ts**  
&nbsp;- the BFF->gateway hop is timed via timeUpstream (esq_bff_outbound_duration_seconds), stopped once on both  
&nbsp;   proxy paths -- idempotent so the res close event cannot double-count (I42/L8+L9)  
**src\config.ts**  
&nbsp;- per-pillar sub-switches: a separate metrics.enabled, and tracing.enabled via pillarOn under the  
&nbsp;   ESQ_OBSERVABILITY_ENABLED umbrella (I41)  
**src\auth\openidClient.ts**  
&nbsp;- the KeyCloak issuer discovery is wrapped in traceKcCall, so it appears as a CLIENT span in the trace  
**src\auth\routes.ts**  
&nbsp;- the KeyCloak token exchange (callback) is wrapped in traceKcCall (CLIENT span)  
**src\auth\tokens.ts**  
&nbsp;- the KeyCloak token refresh is wrapped in traceKcCall (CLIENT span); the refresh token is narrowed to a local  
&nbsp;   so it stays narrowed inside the closure  

**07/15/2026** mir0n  v1.2.11 -- T11 cleanup: fix/resolve issues noted during development  
**src\config.ts**  
&nbsp;- tracing.enabled now reads ESQ_OBSERVABILITY_ENABLED (was ESQ_TRACING_ENABLED), the same umbrella switch the  
&nbsp;   Java services use; it gates the BFF tracing AND the BFF metrics surface (I13)  

**07/10/2026** mir0n  v1.2.11 -- metrics foundation (O1): the BFF publishes its own metrics  
**src\util\metrics.ts  (new)**  
&nbsp;- the BFF Prometheus /metrics surface (prom-client): initMetrics() registers the Node runtime defaults  
&nbsp;   (process + event-loop + heap) plus a bff_http_request_duration_seconds histogram; metricsMiddleware() times  
&nbsp;   each request by method / coarse route / status; metricsHandler() serves /metrics. Every series carries  
&nbsp;   application="esq-backend". Gated by the observability umbrella (config.tracing.enabled) -- off by default  
**src\index.ts**  
&nbsp;- initMetrics(config) at startup; app.use(metricsMiddleware); app.get('/metrics', metricsHandler)  
**package.json**  
&nbsp;- prom-client ^15.1.3 added  

**07/09/2026** mir0n  v1.2.11 -- the BFF tracer resource carries service.instance.id  
**src\util\trace.ts**  
&nbsp;- the tracer resource now carries service.instance.id, the INSTANCE_ID constant in the Java  
&nbsp;   . shape ('esq-backend.' + the host name's trailing ordinal after the last dash when  
&nbsp;   that tail is all digits, else 0 -- the EsqUtils.instanceNo() rule). The collector rewrites service.name  
&nbsp;   to it on the traces pipeline, so every BFF span is badged with the replica that served the request  

**07/08/2026** mir0n  v1.2.11 -- distributed tracing (O2): the BFF is the first hop of the trace  
**src\util\trace.ts**  
&nbsp;- the whole BFF tracing surface lives in this one module: the OpenTelemetry engine, the W3C helpers and  
&nbsp;   traceMiddleware  
&nbsp;- OpenTelemetry Node SDK: initTracing / shutdownTracing build the OTLP exporter + sampler; a custom  
&nbsp;   IdGenerator seeds the root traceId from the settled CORRELATION id (never the per-request id), keeping  
&nbsp;   traceId == correlationId. Off by default (esquire.tracing.enabled)  
&nbsp;- the BFF settles the canonical correlation id itself (kept when W3C-shaped, converted otherwise, else  
&nbsp;   generated; the request id is never a seed) and always exposes it on req.esqCorrelationId + the response  
&nbsp;- added the W3C helpers toW3cTraceId / isW3cTraceId / generateW3cId / settleCorrelationId /  
&nbsp;   buildTraceparent, kept in step with the Java common.EsqUtils  
&nbsp;- traceMiddleware opens the BFF root server span via beginTrace() and finishes it on response, exposing  
&nbsp;   req.esqTraceparent for the upstream call -- so the BFF is the first hop of the distributed trace  
&nbsp;   (BFF -> gateway -> service)  
&nbsp;- the span is opened only on a traced path -- isTracedPath() + TRACED_PREFIXES (/api, /auth); off them  
&nbsp;   (SPA shell, static assets, health probes) no span is created and req.esqTraceparent is a plain  
&nbsp;   traceparent carrying the correlation id. The ids are settled on EVERY request  
**src\proxy\apiProxy.ts**  
&nbsp;- upstream calls carry Esq-Correlation-ID (the settled id, replacing the forward-only X-Correlation-ID) plus  
&nbsp;   the traceparent built from that same id, on both the cacheable GET path and the proxied path  
**src\config.ts**  
&nbsp;- added tracing { enabled, otlpEndpoint, samplingRatio } from ESQ_TRACING_ENABLED / ESQ_OTLP_ENDPOINT /  
&nbsp;   ESQ_TRACING_SAMPLING_RATIO (off by default)  
**src\index.ts**  
&nbsp;- initTracing(config) before any request is handled; SIGTERM flushes in-flight spans via shutdownTracing()  
&nbsp;   before the server closes (both from util\trace.ts alongside traceMiddleware)  
**package.json**  
&nbsp;- @opentelemetry/api, /core, /resources, /sdk-trace-base, /sdk-trace-node, /exporter-trace-otlp-http added  

**07/07/2026** mir0n  v1.2.11 -- BFF stamps requestId / correlationId on each log line  
**src\util\log.ts**  
&nbsp;- httpLogger customProps: stamp each request line with requestId (esqRequestId) and correlationId  
&nbsp;   (esqCorrelationId when present), matching the ECS field names  

### frontend/src/changes.txt


**07/26/2026** mir0n  v1.2.11 -- landing pages: observability + the mature-framework message  
**public\landing\architecture.html**  
&nbsp;- Observability Stack section added (o11yStack.png + the seven o11y components: Postgres Exporter,  
&nbsp;   Prometheus, OpenTelemetry Collector, Grafana Tempo, Alloy, Loki, Grafana), mirroring the services README  
**public\landing\vision.html**  
&nbsp;- "A mature framework -- everything the stack makes possible" section (the fifteen factors + high  
&nbsp;   availability, full observability, hybrid engine, open at every layer, running for real)  
**public\landing\why-it-matters.html**  
&nbsp;- two value points added -- observability and high availability -- plus a finished-foundation closer  
**public\landing\what-is-it.html**  
&nbsp;- mature / complete-framework closing paragraph  
**public\landing\who-needs-it.html**  
&nbsp;- mature / complete-framework closing paragraph  
**public\landing\vs-competition.html**  
&nbsp;- mature-framework intro reframing the comparison  

**07/06/2026** mir0n  session-expired notice grouped with the login hint (button no longer displaced) + marquee scroll  
**explorer\flatTree\app-shell.html**  
&nbsp;- session-expired notice + login hint grouped in .toolbar-login-area (grid col-3) so the notice no longer displaces the login button; notice text wrapped in a .notice-roll marquee span  
**explorer\flatTree\app-shell.scss**  
&nbsp;- .toolbar-login-area grid cell (col-3) for the login affordances; .session-expired-notice marquee (fixed-width clip, esq-notice-marquee keyframes, reduced-motion) + font-weight  

### hauberk/changes.txt


**07/19/2026** mir0n  v1.2.11 -- T12: the OKE performance matrix  
oke-perf-matrix.ps1  (new)  
&nbsp;- the OKE twin of perf-matrix.ps1: drives the 200-VU super-load across x1/x2 x OFF/LOG/FULL on the LIVE OKE  
&nbsp;   cluster, same CSV schema (perf-matrix-report.py reads it). TOGGLE IN PLACE, not from scratch -- OKE is live  
&nbsp;   and ALTER-migrated, no PVC wipe: each cell scales the replicas + calls oke-o11y-on , with clean-house  
&nbsp;   between cells. The broker is NEVER rolled (SKIP_INFRA_ROLL -- a broker bounce drops the app's messagingBus,  
&nbsp;   which does not self-heal); Wait-OkePods kicks any straggler. ONE run per config (no from-scratch, so a second  
&nbsp;   run is not an independent replicate -- it only deepens the run-order drift), MaxLoads 12 (OKE warms far  
&nbsp;   slower over the ~55ms RTT). Starts and ends at the OKE default (ERROR logging, no stack, x2)  
oke-perf-matrix.bat  (new)  
&nbsp;- entry point for the OKE matrix: launches oke-perf-matrix.ps1 detached so a multi-hour run survives the  
&nbsp;   console (resumable); --fresh starts a new CSV, --fg runs in the current console; refuses docker-desktop  

**07/17/2026** mir0n  v1.2.11 -- T11 cleanup: fix/resolve issues noted during development  
**perf-matrix.ps1**  
&nbsp;- the o11y arms go from OFF/ON to three modes OFF / LOG / FULL so logging is isolated from tracing+metrics;  
&nbsp;   the knob is levelMir0n (not levelRoot, which cannot silence the app -- pro.mir0n reaches the console by  
&nbsp;   additivity); -Scale scales the VU count, -Only runs a subset; docker is dropped from the o11y measurement  
&nbsp;   (uncapped -> its sag biases the delta) and kept only as a smoke test; required-infra-only removes kafka and  
&nbsp;   (at x1) redis where nothing under test uses them (I49)  

**07/15/2026** mir0n  v1.2.11 -- T11 cleanup: fix/resolve issues noted during development  
hauberk-S.properties  (new)  
&nbsp;- the VANILLA token-relay overlay: tokenRelay.type=vanilla + the esq-hauberk-S client (HTTP Basic at the edge,  
&nbsp;   the gateway runs client_credentials on its behalf) (I8)  
hauberk-M.properties  (new)  
&nbsp;- the PHANTOM token-relay overlay: tokenRelay.type=phantom + the esq-hauberk-M client (a Bearer the gateway  
&nbsp;   exchanges via RFC 8693) (I8)  

**07/14/2026** mir0n  v1.2.11 -- the performance matrix; a VU whose setup failed no longer spins; the user pool excludes the create loop's office  
perf-matrix.bat  (new)  
&nbsp;- entry point for the performance matrix: 6 configurations (docker / k8s x1 / k8s x2, each o11y OFF and ON) x 2  
&nbsp;   runs x 4+ loads. Launches perf-matrix.ps1 detached so a multi-hour matrix survives the console; --fresh starts  
&nbsp;   a new CSV, --fg runs in the current console  
perf-matrix.ps1  (new)  
&nbsp;- the matrix engine. Every run is built FROM SCRATCH -- the stack is torn down and rebuilt and the Postgres,  
&nbsp;   KeyCloak and broker data dropped (k8s-down.bat leaves the PVCs and `docker compose down` keeps the volume, so  
&nbsp;   both are deleted explicitly). Loads run until the throughput STOPS MOVING (4 minimum, extended while the last  
&nbsp;   load is still climbing >3%, capped at 6). o11y OFF also UNINSTALLS the viewing stack. Only one stack is ever  
&nbsp;   up: before the docker half it uninstalls every esquire helm release and ABORTS if any pod survives. Readiness  
&nbsp;   is gated on the DB being seeded + the realm imported + the gateway UP, and a failed playground prepare aborts  
&nbsp;   the run. Results are appended to matrix.csv after every load and a completed run is skipped on rerun  
perf-matrix-report.py  (new)  
&nbsp;- reads matrix.csv and prints the three answers: does super-load pass (KO rate per config), what is the noise  
&nbsp;   floor (the gap between a config's own two from-scratch runs), and what each comparison costs. Steady state is  
&nbsp;   the PLATEAU -- the trailing loads within 3% of each other; load 1 (warm-up) and any load still climbing or  
&nbsp;   sagging are excluded. Every comparison is printed next to the noise it must beat, plus a separation check  
**simulations.LoadScenarios**  
&nbsp;- exitHereIfFailed() between the setup and the .forever() loop in all five scenarios -- a VU whose setup failed  
&nbsp;   used to walk into the loop with no session attributes, so its requests were never SENT and the loop spun at  
&nbsp;   full CPU issuing nothing  
**chain.PoolFetchUsers**  
&nbsp;- userPool EXCLUDES users parented by the deepest office -- the CREATE scenario's churn ground. It fetches the  
&nbsp;   subtree, finds the deepest ORG by the same rule LoadScenarios.CREATE uses, and drops the users whose parentId  
&nbsp;   is that office; an empty pool marks the VU failed  
**hauberk-k8s.properties**  
&nbsp;- kc.base and gw.base both moved onto the ingress (esquire.localhost / api.esquire.localhost); no port-forward.  
&nbsp;   gw.base was localhost:8808, a single-threaded userspace proxy that capped every k8s load run; kc.base was  
&nbsp;   localhost:8081 to dodge a JDK-HttpClient/nginx hang that KcTokenClient already fixes by pinning HTTP_1_1, and  
&nbsp;   the forward died on every KeyCloak rollout  

---

## Commits

```

-- 2026-07-27 | commit: fe78254 | mir0n.the.programmer | v1.2.11 -- Finalization --
M	doc/release_notes.txt
M	e2e-test/cycle-oci.bat
M	e2e-test/e2e-oci.bat
M	e2e-test/tests/16-session-expiry.spec.ts
M	e2e-test/tests/20-token-relay.spec.ts
M	frontend/public/landing/vision.html
M	frontend/public/landing/vs-competition.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/who-needs-it.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/changes.txt
 11 files changed, 128 insertions(+), 92 deletions(-)


-- 2026-07-26 | commit: 673a3a2 | mir0n.the.programmer | v1.2.11 -- up-to-date landing pages --
M	README.md
M	frontend/public/img/ComponentModel.png
A	frontend/public/img/o11yStack.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/vision.html
M	frontend/public/landing/vs-competition.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/who-needs-it.html
M	frontend/public/landing/why-it-matters.html
A	frontend/public/logo/OTelCollector.png
A	frontend/public/logo/alloy_icon.png
A	frontend/public/logo/grafana_icon.svg
A	frontend/public/logo/loki_icon.svg
A	frontend/public/logo/prometheus_logo.svg
A	frontend/public/logo/tempo_logo.svg
 15 files changed, 303 insertions(+), 6 deletions(-)

-- 2026-07-23 | commit: 04369d6 | mir0n.the.programmer | v1.2.11 -- homework: fixes noted during the audit --
M	backend/README.md
M	backend/src/auth/routes.ts
M	backend/src/changes.txt
M	backend/src/config.ts
M	backend/test/config.test.ts
M	doc/release_notes.txt
 6 files changed, 63 insertions(+), 9 deletions(-)

-- 2026-07-19 | commit: ff542ac | mir0n.the.programmer | v1.2.11 -- T12: the OKE performance matrix --
M	doc/release_notes.txt
M	hauberk/changes.txt
A	hauberk/oke-perf-matrix.bat
A	hauberk/oke-perf-matrix.ps1
 4 files changed, 384 insertions(+)

-- 2026-07-17 | commit: 171455b | mir0n.the.programmer |  v1.2.11 -- T11 cleanup: fix/resolve issues noted during development (complete) --
M	backend/src/auth/openidClient.ts
M	backend/src/auth/routes.ts
M	backend/src/auth/tokens.ts
M	backend/src/changes.txt
M	backend/src/config.ts
M	backend/src/proxy/apiProxy.ts
M	backend/src/util/metrics.ts
M	backend/src/util/trace.ts
A	backend/test/util/w3c-id.conformance.test.ts
M	doc/release_notes.txt
M	hauberk/changes.txt
M	hauberk/perf-matrix.ps1
 12 files changed, 454 insertions(+), 39 deletions(-)

-- 2026-07-15 | commit: 0520274 | mir0n.the.programmer | v1.2.11 -- T11 cleanup: fix/resolve issues noted during development --
M	backend/src/changes.txt
M	backend/src/config.ts
M	doc/release_notes.txt
M	e2e-test/e2e-k8s.bat
M	e2e-test/e2e-test.scope.md
A	e2e-test/tests/20-token-relay.spec.ts
M	hauberk/changes.txt
A	hauberk/hauberk-M.properties
A	hauberk/hauberk-S.properties
 9 files changed, 125 insertions(+), 1 deletion(-)

-- 2026-07-14 | commit: 4c537a9 | mir0n.the.programmer | v1.2.11 -- hauberk: a performance matrix that measures the load-test results across every environment --
M	doc/release_notes.txt
M	hauberk/changes.txt
M	hauberk/hauberk-k8s.properties
A	hauberk/perf-matrix-report.py
A	hauberk/perf-matrix.bat
A	hauberk/perf-matrix.ps1
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchUsers.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
 8 files changed, 695 insertions(+), 10 deletions(-)

-- 2026-07-11 | commit: 61f7e87 | mir0n.the.programmer | v1.2.11 -- e2e: the login-identity path is finally covered, roles included --
M	doc/release_notes.txt
M	e2e-test/cycle/cycle.spec.ts
M	e2e-test/e2e-test.scope.md
A	e2e-test/tests/19-access-profile-sync.spec.ts
 4 files changed, 177 insertions(+), 5 deletions(-)

-- 2026-07-10 | commit: 258dbbc | mir0n.the.programmer | v1.2.11 -- observability: the login backend publishes its own live measurements --
M	backend/package-lock.json
M	backend/package.json
M	backend/src/changes.txt
M	backend/src/index.ts
A	backend/src/util/metrics.ts
M	doc/release_notes.txt
A	e2e-test/cycle-k8s.bat
A	e2e-test/cycle-oci.bat
A	e2e-test/cycle-stop.bat
A	e2e-test/cycle-test.bat
A	e2e-test/cycle/_disc.spec.ts
A	e2e-test/cycle/cycle.spec.ts
A	e2e-test/cycle/playwright.config.ts
M	e2e-test/e2e-test.scope.md
 14 files changed, 413 insertions(+)

-- 2026-07-09 | commit: ded9b6f | mir0n.the.programmer | v1.2.11 -- observability: traces name the login backend copy that served the request --
M	backend/src/changes.txt
M	backend/src/util/trace.ts
M	doc/release_notes.txt
 3 files changed, 30 insertions(+), 1 deletion(-)

-- 2026-07-08 | commit: c8bbca5 | mir0n.the.programmer | v1.2.11 -- observability: request tracing in the login backend --
M	backend/package-lock.json
M	backend/package.json
M	backend/src/changes.txt
M	backend/src/config.ts
M	backend/src/index.ts
M	backend/src/proxy/apiProxy.ts
M	backend/src/util/trace.ts
M	backend/test/util/trace.test.ts
M	doc/release_notes.txt
 9 files changed, 736 insertions(+), 39 deletions(-)

-- 2026-07-07 | commit: 9951f55 | mir0n.the.programmer | v1.2.11 -- the login backend tags its logs with the request id --
M	backend/src/changes.txt
M	backend/src/util/log.ts
M	doc/release_notes.txt
 3 files changed, 33 insertions(+), 1 deletion(-)

-- 2026-07-06 | commit: c2590b2 | mir0n.the.programmer | v1.2.11 -- session expiration message --
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
M	e2e-test/tests/16-session-expiry.spec.ts
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
 6 files changed, 89 insertions(+), 17 deletions(-)

-- 2026-07-06 | commit: 3854287 | mir0n.the.programmer | v1.2.11 -- e2e: Details dialog Esc-close coverage --
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
A	e2e-test/tests/18-details-esc-focus.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
 5 files changed, 81 insertions(+), 2 deletions(-)

-- 2026-07-05 | commit: ba34df2 | mir0n.the.programmer | v1.2.11 - use latest ui.lib --
M	frontend/package-lock.json
M	frontend/package.json
 2 files changed, 5 insertions(+), 5 deletions(-)

-- 2026-07-05 | commit: 450b8d9 | mir0n.the.programmer | v1.2.11 -- version bump --
M	backend/package-lock.json
M	backend/package.json
M	e2e-test/package.json
M	frontend/package-lock.json
M	frontend/package.json
M	hauberk/pom.xml
 6 files changed, 10 insertions(+), 10 deletions(-)

-- 2026-07-05 | commit: ad6029c | mir0n.the.programmer | Create report_v1.2.10.md --
A	doc/reports/report_v1.2.10.md
 1 file changed, 300 insertions(+)

```

---

## Files Modified

```
M	README.md
M	backend/README.md
M	backend/package-lock.json
M	backend/package.json
M	backend/src/auth/openidClient.ts
M	backend/src/auth/routes.ts
M	backend/src/auth/tokens.ts
M	backend/src/changes.txt
M	backend/src/config.ts
M	backend/src/index.ts
M	backend/src/proxy/apiProxy.ts
M	backend/src/util/log.ts
A	backend/src/util/metrics.ts
M	backend/src/util/trace.ts
M	backend/test/config.test.ts
M	backend/test/util/trace.test.ts
A	backend/test/util/w3c-id.conformance.test.ts
M	doc/release_notes.txt
A	doc/reports/report_v1.2.10.md
A	e2e-test/cycle-k8s.bat
A	e2e-test/cycle-oci.bat
A	e2e-test/cycle-stop.bat
A	e2e-test/cycle-test.bat
A	e2e-test/cycle/_disc.spec.ts
A	e2e-test/cycle/cycle.spec.ts
A	e2e-test/cycle/playwright.config.ts
M	e2e-test/e2e-k8s.bat
M	e2e-test/e2e-oci.bat
M	e2e-test/e2e-test.scope.md
M	e2e-test/package.json
M	e2e-test/tests/16-session-expiry.spec.ts
A	e2e-test/tests/18-details-esc-focus.spec.ts
A	e2e-test/tests/19-access-profile-sync.spec.ts
A	e2e-test/tests/20-token-relay.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
A	frontend/public/img/o11yStack.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/vs-competition.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/who-needs-it.html
M	frontend/public/landing/why-it-matters.html
A	frontend/public/logo/OTelCollector.png
A	frontend/public/logo/alloy_icon.png
A	frontend/public/logo/grafana_icon.svg
A	frontend/public/logo/loki_icon.svg
A	frontend/public/logo/prometheus_logo.svg
A	frontend/public/logo/tempo_logo.svg
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	hauberk/changes.txt
A	hauberk/hauberk-M.properties
A	hauberk/hauberk-S.properties
M	hauberk/hauberk-k8s.properties
A	hauberk/oke-perf-matrix.bat
A	hauberk/oke-perf-matrix.ps1
A	hauberk/perf-matrix-report.py
A	hauberk/perf-matrix.bat
A	hauberk/perf-matrix.ps1
M	hauberk/pom.xml
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchUsers.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
 64 files changed, 3921 insertions(+), 132 deletions(-)
```

---

*From `v1.2.10` till `v1.2.11`*
