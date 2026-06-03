# Release Report: v1.2.5 → v1.2.6

**Repo:** `esquire.explorer/develop`  
**Top commit:** `11cf986`

---

## Release Notes

### doc/release_notes.txt


**v1.2.6-2606.0219**  v1.2.6 race-8c verification harness + name-prefix residue cleanup  
&nbsp;: Feature:     hauberk: race-8c verify Simulation (RaceMoveCreateKc) diffs DB ep_path against the KC user  
&nbsp;                esq_rootpath via the master-realm admin REST API; poll-until-stable with per-tick admin-token refresh  
&nbsp;: Feature:     hauberk: deterministic single-shot race-8c repro (RaceMoveCreateKcSingleShot) -- buffer OFF  
&nbsp;                reproduces the stale path, buffer ON proves the kcMaster path-buffer fix  
&nbsp;: Feature:     hauberk: KC orphan cleanup (KcCleanup Simulation + CleanupKcOrphans chain) removes hauberk-* KC users  
&nbsp;: Feature:     hauberk: residue-cleanup is now name-prefix driven (-Dcleanup.prefix) and disconnects-then-deletes  
&nbsp;                via the API -- purges msgloss / other-named Test House leftovers, including on prod  
&nbsp;: Config:      hauberk: kc.admin.user / kc.admin.password (master-realm admin) added; MoveEntity accepts  
&nbsp;                202 in addition to 200 (v1.2.6 Goal 3 made /esq-move async-ack)  
&nbsp;: Config:      frontend + backend bumped to 1.2.6 (align with the services v1.2.6 sprint)  
&nbsp;  Components:   hauberk, frontend, backend  

---

## Code Changes

### frontend/src/changes.txt


**06/02/2026** mir0n  v1.2.6 landing-page Architecture tab updated for the mcMaster refine  
**explorer\flatTree\app-shell.html**  
&nbsp;- Architecture heading bumped v1.2.5 -> v1.2.6;  

**05/24/2026** mir0n  v1.2.5 landing-page Architecture tab updated for the bizTree redesign  
**explorer\flatTree\app-shell.html**  
&nbsp;- Architecture heading bumped v1.2.4 -> v1.2.5; bizTree blurb reframed as a recoverable cache  
&nbsp;   service (two-buffer anti-entropy night-watch that self-heals dropped events)  

### hauberk/changes.txt


**06/02/2026** mir0n  v1.2.6 race-8c -- KC esq_rootpath verification + single-shot repro + KC orphan cleanup  
chain.KcAdminAuth  (new)  
&nbsp;- POST master-realm token endpoint (admin-cli, grant_type=password, kc.admin.user / kc.admin.password);  
&nbsp;   saves access_token as session "kcAdminToken" for subsequent KC admin REST calls  
chain.CleanupKcOrphans  (new)  
&nbsp;- GET esquire-realm users (search=hauberk-) then DELETE each via admin REST (accepts 200 / 204 / 404);  
&nbsp;   reports kcOrphansDeleted  
simulations.RaceMoveCreateKcSimulation  (new)  
&nbsp;- race-8c verify: move-oscillate + connected USR creates; verifier diffs DB ep_path (/esq-cmd-tree) against  
&nbsp;   KC esq_rootpath (admin REST). Poll-until-stable with per-tick KcAdminAuth refresh (60s token) and a  
&nbsp;   KC-count stability gate (3 equal ticks) so a zero-mismatch reading is only taken once kcMaster has drained  
simulations.RaceMoveCreateKcSingleShotSimulation  (new)  
&nbsp;- deterministic single-shot race-8c: one disabled user + exactly ONE move during the keySmith hold, nothing  
&nbsp;   heals it; buffer OFF (ttl=-1) -> FAIL (reproduce), buffer ON (10000) -> PASS (fix proven)  
simulations.KcCleanupSimulation  (new)  
&nbsp;- standalone teardown: KcAdminAuth + CleanupKcOrphans -- DELETE hauberk-* KC users left behind after CleanHouse  
**chain.MoveEntity**  
&nbsp;- accept HTTP 202 in addition to 200 (v1.2.6 Goal 3 made /esq-move async-ack, returns 202 at submit)  
**config.HauberkConfig**  
&nbsp;- KC_ADMIN_USER / KC_ADMIN_PASSWORD added (kc.admin.user / kc.admin.password, default admin/q)  
**simulations.RaceMoveCreateSimulation**  
&nbsp;- bounded load (during(dur) replaces forever()) + 200ms / 100ms pacing; poll-until-quiescent verifier  
&nbsp;   (5s tick, 5-min budget) replaces the single post-load snapshot; int counters + snapshot maps replace  
&nbsp;   the List collectors  
**hauberk.properties**  
&nbsp;- kc.admin.user / kc.admin.password (default admin/q) for the KC admin REST sims  
**simulations.ResidueCleanupSimulation**  
&nbsp;- name-prefix driven: lists offices directly under Test House and runs each whose name starts with  
&nbsp;- Dcleanup.prefix (default "hauberk-office-smoke") through CleanupOfficeByName (disconnect connected  
&nbsp;   USRs, then delete the subtree bottom-up via the FK /esq-cmd-tree). Catches msgloss / other-named  
&nbsp;   leftovers the old exact-match missed; deletes via the API so it works on prod (direct DB deletes blocked)  

---

## Commits

```

-- 2026-06-02 | commit: 11cf986 | mir0n.the.programmer | v1.2.6 race-8c verification harness + name-prefix residue cleanup --
M	README.md
M	backend/package.json
M	doc/release_notes.txt
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	hauberk/changes.txt
M	hauberk/hauberk.properties
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupKcOrphans.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/KcAdminAuth.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/MoveEntity.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcCleanupSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSingleShotSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
M	openapi-generate/esqEsquireApi.yaml
 19 files changed, 1085 insertions(+), 157 deletions(-)

-- 2026-05-24 | commit: b1db62c | mir0n.the.programmer | Create report_v1.2.5.md --
A	doc/reports/report_v1.2.5.md
 1 file changed, 159 insertions(+)
```

---

## Files Modified

```
M	README.md
M	backend/package.json
M	doc/release_notes.txt
A	doc/reports/report_v1.2.5.md
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	hauberk/changes.txt
M	hauberk/hauberk.properties
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupKcOrphans.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/KcAdminAuth.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/MoveEntity.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcCleanupSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSingleShotSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
M	openapi-generate/esqEsquireApi.yaml
 20 files changed, 1244 insertions(+), 157 deletions(-)
```

---

*From `v1.2.5` till `v1.2.6`*
