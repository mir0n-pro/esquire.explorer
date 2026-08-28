# Release Report: v1.2.12 → v1.2.13

**Repo:** `esquire.explorer/develop`  
**Top commit:** `69beaad`

---

## Release Notes

### doc/release_notes.txt


**v1.2.13-2608.2721**  v1.2.13 -- Finalization  
&nbsp;: Fix:         Open API up-to-date  
&nbsp;   Components:   frontend  

**v1.2.13-2608.2620**  v1.2.13 -- Hardening  
&nbsp;: Fix:         cookies and authorization headers no longer reach the browser tier logs  
&nbsp;: Fix:         a KeyCloak call is named on the topology map  
&nbsp;: Fix:         the load harness sends the transfer body the server expects  
&nbsp;: Fix:         e2e 15-system-entity-protection: the root office is checked against the protection that refuses it  
&nbsp;: New:         e2e 21-credential-state-sync: a password change and two-factor, requested then withdrawn  
&nbsp;: Doc:         e2e-test\e2e-test.scope.md  
&nbsp;   Components:   backend,  
&nbsp;                 hauberk,  
&nbsp;                 e2e  

**v1.2.13-2608.2119**  v1.2.13 -- the promise, and what stands behind it  
&nbsp;: Doc:         the site carries a new motto  
&nbsp;: Doc:         the landing tabs are tuned to stand behind it  
&nbsp;: Doc:         the social banner is re-drawn to the new wording  
&nbsp;   Components:   frontend  

**v1.2.13-2608.2017**  v1.2.13 -- the composed services on the cloud  
&nbsp;: Feature:     the load harness measures the composed setup too, at one and two copies of each service,  
&nbsp;                 with monitoring off, logging only, and everything on  
&nbsp;: Fix:         a measurement run waits for the gate the way that setup answers, instead of asking for a  
&nbsp;                 page the composed gate does not serve  
&nbsp;   Components:   hauberk,  
&nbsp;                 backend  

**v1.2.13-2608.1521**  v1.2.13 -- gateWard  
&nbsp;: Config:      the load harness's notes on what a lookup may answer say that something absent is  
&nbsp;                 "not found"; the older answer stays accepted so a run works against an older deployment  
&nbsp;   Components:   hauberk  

---

## Code Changes

### backend/src/changes.txt


**08/20/2026** mir0n  v1.2.13 -- the composed services on the cloud  
**src\util\trace.ts**  
&nbsp;- the instance-number example names the compact workload (esquire-backend-1)  

### frontend/src/changes.txt


**08/27/2026** mir0n  v1.2.13 -- rest/ regenerated for the framework's error contract  
**rest\api\esquire.service.ts**  
&nbsp;- regenerated from esqEsquireApi.yaml: every operation now accepts application/problem+json as well as  
&nbsp;   application/json  
**rest\model\problemDetail.ts  (new)**  
&nbsp;- the error body every service returns: type / title / status / detail / instance plus the nested  
&nbsp;   properties object  
**rest\model\problemDetailProperties.ts  (new)**  
&nbsp;- timestamp, traceId, correlationId, requestId, and the conditional stackTrace and errors  
**rest\model\problemDetailFieldError.ts  (new)**  
&nbsp;- fieldName, message, fieldLabel, tabIndex -- one entry of the errors array  
**rest\model\models.ts**  
&nbsp;- the three ProblemDetail models exported  

### hauberk/changes.txt


**08/26/2026** mir0n  v1.2.13 -- the transfer body, and the test-data marker removed  
**Transfer.java**  
&nbsp;- the transfer body sends the amount NEGATED, a rate of 1, and refCode "other"  
**EntityKinds.java**  
&nbsp;- TEST_EMAIL_DOMAIN removed  
**CreateUser.java**  
&nbsp;- userEmail builds the domain inline  
**CreateAccount.java**  
&nbsp;- the account body no longer carries desc  

**08/20/2026** mir0n  v1.2.13 -- the composed services on the cloud  
**perf-matrix.ps1**  
&nbsp;- six k8sc-* configs for the compact stack (x1/x2 x OFF/LOG/FULL), each carrying dir=k8s-compact; APPS_COMPACT  
&nbsp;   is gateward/mesnie/pacman/aukeep/backend, and Wl() returns the workload name per profile -- esquire-  
&nbsp;   on compact, esquire-- on classic  
&nbsp;**- Build-K8s takes its stack folder and its fleet from the config instead of the fixed services\k8s**  
&nbsp;- Wait-Url reads the status: 2xx/3xx passes, and 4xx passes only with -GuardedOk; the gateway gate uses it  
&nbsp;   and compact gates on /esq-enode, classic on /actuator/health  
**oke-perf-matrix.ps1**  
&nbsp;- Set-OkeConfig exports ESQ_REPLICAS before the arm, and Restore-Default's helm upgrade carries  
&nbsp;- -force-conflicts  

**08/15/2026** mir0n  v1.2.13 -- gateWard  
**chain.EnsureOffice**  
&nbsp;- the note on the accepted statuses states that an absent office is a 404; 400 stays accepted  
**chain.LookupOfficeIdByName**  
&nbsp;- the note on the accepted statuses states that an absent office is a 404; 400 stays accepted  
**chain.LookupAccessProfile**  
&nbsp;- the class note states that "no access profile yet" is a 404; 400 stays accepted  
**simulations.LoadScenarios**  
&nbsp;- the in-loop transient-failure example no longer names a status code  

---

## Commits

```

-- 2026-08-28 | commit: 69beaad | mir0n.the.programmer | Let OKE CI/CD work --
M	e2e-test/playwright.config.ts
M	e2e-test/tests/20-token-relay.spec.ts
M	e2e-test/tests/21-credential-state-sync.spec.ts
 3 files changed, 13 insertions(+), 13 deletions(-)


-- 2026-08-27 | commit: f151111 | mir0n.the.programmer | v1.2.13 -- Finalization --
M	README.md
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/index.html
M	frontend/src/rest/.openapi-generator/FILES
M	frontend/src/rest/api/esquire.service.ts
M	frontend/src/rest/model/models.ts
A	frontend/src/rest/model/problemDetail.ts
A	frontend/src/rest/model/problemDetailFieldError.ts
A	frontend/src/rest/model/problemDetailProperties.ts
M	hauberk/hauberk-oke.properties
M	hauberk/k8s-smoke.bat
M	hauberk/perf-matrix.ps1
M	hauberk/smoke-5.bat
M	openapi-generate/esqEsquireApi.yaml
 15 files changed, 658 insertions(+), 83 deletions(-)

-- 2026-08-27 | commit: f1f0c23 | mir0n.the.programmer | v1.2.13 -- Hardening --
M	backend/src/util/log.ts
M	backend/src/util/trace.ts
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
M	e2e-test/tests/15-system-entity-protection.spec.ts
A	e2e-test/tests/21-credential-state-sync.spec.ts
M	hauberk/changes.txt
A	hauberk/hauberk-compact.properties
A	hauberk/hauberk-k8s-compact.properties
M	hauberk/hauberk-oke.properties
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupOfficeByName.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateAccount.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateUser.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DeleteEntity.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchAccounts.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Transfer.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/EntityKinds.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/EntitySmokeSimulation.java
 18 files changed, 436 insertions(+), 41 deletions(-)

-- 2026-08-21 | commit: 7e38a4c | mir0n.the.programmer | v1.2.13 -- the promise, and what stands behind it --
M	doc/release_notes.txt
A	frontend/public/img/ComponentModel.Compact.png
M	frontend/public/img/ComponentModel.png
M	frontend/public/img/og-banner.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/vision.html
M	frontend/public/landing/vs-competition.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/who-needs-it.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/index.html
 11 files changed, 156 insertions(+), 21 deletions(-)

-- 2026-08-20 | commit: dfaea8a | mir0n.the.programmer | v1.2.13 -- the composed services on the cloud --
M	backend/package-lock.json
M	backend/package.json
M	backend/src/changes.txt
M	backend/src/util/trace.ts
M	doc/release_notes.txt
M	e2e-test/package.json
M	hauberk/changes.txt
M	hauberk/oke-perf-matrix.ps1
M	hauberk/perf-matrix.ps1
 9 files changed, 174 insertions(+), 29 deletions(-)

-- 2026-08-15 | commit: f3fad0e | mir0n.the.programmer |  v1.2.13 -- gateWard --
M	doc/release_notes.txt
M	frontend/package-lock.json
M	frontend/package.json
M	hauberk/changes.txt
M	hauberk/pom.xml
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/EnsureOffice.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupAccessProfile.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupOfficeIdByName.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
 9 files changed, 34 insertions(+), 14 deletions(-)

-- 2026-08-11 | commit: e56c5f6 | mir0n.the.programmer | Create report_v1.2.12.md --
A	doc/reports/report_v1.2.12.md
 1 file changed, 63 insertions(+)

```

---

## Files Modified

```
M	README.md
M	backend/package-lock.json
M	backend/package.json
M	backend/src/changes.txt
M	backend/src/util/log.ts
M	backend/src/util/trace.ts
M	doc/release_notes.txt
A	doc/reports/report_v1.2.12.md
M	e2e-test/e2e-test.scope.md
M	e2e-test/package.json
M	e2e-test/playwright.config.ts
M	e2e-test/tests/15-system-entity-protection.spec.ts
M	e2e-test/tests/20-token-relay.spec.ts
A	e2e-test/tests/21-credential-state-sync.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
A	frontend/public/img/ComponentModel.Compact.png
M	frontend/public/img/ComponentModel.png
M	frontend/public/img/og-banner.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/vision.html
M	frontend/public/landing/vs-competition.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/who-needs-it.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/changes.txt
M	frontend/src/index.html
M	frontend/src/rest/.openapi-generator/FILES
M	frontend/src/rest/api/esquire.service.ts
M	frontend/src/rest/model/models.ts
A	frontend/src/rest/model/problemDetail.ts
A	frontend/src/rest/model/problemDetailFieldError.ts
A	frontend/src/rest/model/problemDetailProperties.ts
M	hauberk/changes.txt
A	hauberk/hauberk-compact.properties
A	hauberk/hauberk-k8s-compact.properties
M	hauberk/hauberk-oke.properties
M	hauberk/k8s-smoke.bat
M	hauberk/oke-perf-matrix.ps1
M	hauberk/perf-matrix.ps1
M	hauberk/pom.xml
M	hauberk/smoke-5.bat
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupOfficeByName.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateAccount.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateUser.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DeleteEntity.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/EnsureOffice.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupAccessProfile.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupOfficeIdByName.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchAccounts.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Transfer.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/EntityKinds.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/EntitySmokeSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
M	openapi-generate/esqEsquireApi.yaml
 55 files changed, 1527 insertions(+), 194 deletions(-)
```

---

*From `v1.2.12` till `v1.2.13`*
