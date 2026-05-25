# Release Report: v1.2.4 → v1.2.5

**Repo:** `esquire.explorer/develop`  
**Top commit:** `c32f908`

---

## Release Notes

### doc/release_notes.txt


**v1.2.5-2605.2323**  v1.2.5 night-watch harness, open api spec update  
&nbsp;: Feature:     hauberk: message-loss Simulations (SWAP + TERMINATE) prove the bizTree night-watch  
&nbsp;                detects dropped JMS messages and reacts; fully automatic via a new infra-command (Cmd) framework  
&nbsp;: Feature:     hauberk: configurable cmd.* shell steps (docker + local-k8s + OKE overlays) + ForceSweep /  
&nbsp;                WaitCacheReady / WaitBizTreeDown chains; RaceCacheLoad restart automated (no operator)  
&nbsp;: Feature:     OpenAPI spec (esqEsquireApi.yaml) updated with /esq-sweep (POST, operationId  
&nbsp;                esquireSweep); frontend rest/ client regenerated -- new esquireSweep() force-sweep method  
&nbsp;: Improvement: landing-page Architecture tab updated to v1.2.5 -- bizTree described as a recoverable  
&nbsp;                cache service (anti-entropy night-watch that self-heals dropped events)  
&nbsp;: Config:      frontend + backend bumped to 1.2.5 (align with the backend night-watch sprint)  
&nbsp;  Components:   hauberk, frontend, backend  

---

## Code Changes

### backend/src/changes.txt


**05/23/2026** mir0n  v1.2.5 version bump (night-watch sprint alignment)  
**package.json**  
&nbsp;- version 1.2.4 -> 1.2.5 (no code change; aligns the BFF with the backend sprint)  

### frontend/src/changes.txt


**05/23/2026** mir0n  v1.2.5 rest/ regenerated for the /esq-sweep endpoint; version 1.2.5  
**rest\api\esquire.service.ts**  
&nbsp;- regenerated from esqEsquireApi.yaml (added /esq-sweep POST): new esquireSweep() (202)  
**package.json**  
&nbsp;- version 1.2.4 -> 1.2.5 (align with the backend night-watch sprint)  

### hauberk/changes.txt


**05/23/2026** mir0n  v1.2.5 Taijitu night-watch -- message-loss sims + infra-command framework  
chain.Cmd  (new)  
&nbsp;- sim step that runs a configured infra command (cmd.) through the OS shell (cmd /c on  
&nbsp;   Windows, sh -c elsewhere); {KEY} placeholder substitution from a passed env map; blocks until exit  
chain.ForceSweep  (new)  
&nbsp;- POST /esq-sweep through the gateway (authenticated) to force a night-watch sweep; checks 202  
chain.WaitCacheReady  (new)  
&nbsp;- poll GET /esq-tree until bizTree answers 200 (cache loaded + serving), after a restart/recreate  
chain.WaitBizTreeDown  (new)  
&nbsp;- poll GET /esq-tree until 5xx -- confirms OVER REST that the TERMINATE reaction took bizTree down  
simulations.MessageLossSimulation  (new)  
&nbsp;- night-watch SWAP scenario: recreate biztree (SWAP), stop AMQ, create a user (CREATE broadcast  
&nbsp;   lost), prove it MISSING, wait one sweep, prove the SWAP promoted the fresh shadow (user present);  
&nbsp;   fully automatic via Cmd  
simulations.MessageLossTerminateSimulation  (new)  
&nbsp;- night-watch TERMINATE scenario: recreate biztree (TERMINATE), stop AMQ, create a user, prove  
&nbsp;   drift, force a sweep -> mismatch System.exit, assert bizTree DOWN (WaitBizTreeDown); restores the stack  
**config.HauberkConfig**  
&nbsp;- added the cmd.* infra-command map (COMMANDS) + static command(key) accessor (cmd. property,  
&nbsp;- Dcmd. override)  
**simulations.RaceCacheLoadSimulation**  
&nbsp;- automated the operator restart: a race-restart population fires Cmd.run("restart-biztree") ~15s in  
&nbsp;   (was a manual banner); verify population waits via WaitCacheReady; maxDuration margin raised  
**hauberk.properties**  
&nbsp;- added cmd.* defaults (stop-amq / start-amq / restart-biztree / recreate-biztree -- docker)  
**hauberk-k8s.properties**  
&nbsp;- cmd.* overrides for local k8s (kubectl scale/wait AMQ; kubectl set env + rollout restart biztree)  
**hauberk-oke.properties**  
&nbsp;- cmd.* overrides for OKE prod (same kubectl steps, -n default); enables the message-loss sims  
&nbsp;   against the live cluster (run with the OKE kubectl context active)  

---

## Commits

```

-- 2026-05-24 | commit: c32f908 | mir0n.the.programmer | Update README.md --
M	README.md
 1 file changed, 13 insertions(+)


-- 2026-05-24 | commit: 4703680 | mir0n.the.programmer | v1.2.5 night-watch harness, open api spec update --
M	backend/package.json
M	backend/src/changes.txt
M	doc/release_notes.txt
M	e2e-test/e2e-k8s.bat
M	e2e-test/e2e-oci.bat
M	e2e-test/e2e-test.bat
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/rest/api/esquire.service.ts
M	hauberk/changes.txt
M	hauberk/hauberk-k8s.properties
M	hauberk/hauberk-oke.properties
M	hauberk/hauberk.properties
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Cmd.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ForceSweep.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitBizTreeDown.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitCacheReady.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossTerminateSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceCacheLoadSimulation.java
M	openapi-generate/esqEsquireApi.yaml
 24 files changed, 591 insertions(+), 13 deletions(-)

-- 2026-05-18 | commit: 2dc3b39 | mir0n.the.programmer | Create report_v1.2.4.md --
A	doc/reports/report_v1.2.4.md
 1 file changed, 314 insertions(+)

```

---

## Files Modified

```
M	README.md
M	backend/package.json
M	backend/src/changes.txt
M	doc/release_notes.txt
A	doc/reports/report_v1.2.4.md
M	e2e-test/e2e-k8s.bat
M	e2e-test/e2e-oci.bat
M	e2e-test/e2e-test.bat
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/rest/api/esquire.service.ts
M	hauberk/changes.txt
M	hauberk/hauberk-k8s.properties
M	hauberk/hauberk-oke.properties
M	hauberk/hauberk.properties
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Cmd.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ForceSweep.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitBizTreeDown.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitCacheReady.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossTerminateSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceCacheLoadSimulation.java
M	openapi-generate/esqEsquireApi.yaml
 26 files changed, 918 insertions(+), 13 deletions(-)
```

---

*From `v1.2.4` till `v1.2.5`*
