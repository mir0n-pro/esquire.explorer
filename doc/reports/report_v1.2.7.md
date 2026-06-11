# Release Report: v1.2.6 → v1.2.7

**Repo:** `esquire.explorer/develop`  
**Top commit:** `e2814cd`

---

## Release Notes

### doc/release_notes.txt


**v1.2.7-2606.1021**  v1.2.7 -- e2e: Details ESC-close test hardened for remote latency  
&nbsp;: Fix:         e2e 07-details "closes with ESC" now waits for a populated field  
&nbsp;   Components:   e2e  

**v1.2.7-2606.1016**  v1.2.7 -- release finalized (versions aligned to 1.2.7)  
&nbsp;: Config:      frontend + backend package.json bumped to 1.2.7; hauberk module bumped 1.2.4 -> 1.2.7  
&nbsp;                 (release finalization)  
&nbsp;: Fix:         hauberk SimulationInfo descriptions trimmed to <=90 chars so 'hauberk list' fits the  
&nbsp;                 table (the SimulationCatalogContractTest contract)  
&nbsp;   Components:   frontend,  
&nbsp;                 backend,  
&nbsp;                 hauberk  

**v1.2.7-2606.1000**  v1.2.7 landing-page audit refresh + e2e account-pick fix  
&nbsp;: Doc:         landing-page Architecture tab refreshed for the audit-logging sprint -- v1.2.7 heading, the  
&nbsp;: Fix:         e2e: 11-deposit selects accounts by id (Mer Chant 10011 / Cli Ent 10012) instead of row  
&nbsp;                 position  
&nbsp;   Components:   frontend, e2e  

**v1.2.7-2606.0615**  v1.2.7 hauberk PerformanceMatrix summary fix  
&nbsp;: Fix:         hauberk: post-run PerformanceMatrix summary no longer throws AIOOBE at high sample  
&nbsp;                 counts (synchronized summary + snapshotted row count); run summary / CSV / HTML report complete  
&nbsp;   Components:   hauberk  

---

## Code Changes

### frontend/src/changes.txt


**06/10/2026** mir0n  v1.2.7 landing-page Architecture tab refreshed for the audit-logging sprint  
**explorer\flatTree\app-shell.html**  
&nbsp;- Architecture heading bumped v1.2.6 -> v1.2.7; Esq2025 audit-log note scoped to "when triggers are  
&nbsp;   enabled" + new "Esq2025 audit" component; Messaging Bus now three channels (added the optional Audit  
&nbsp;   Broadcast Bus); new xx-rod and Redis DB components; the audit principle + feature-table row reframed  
&nbsp;   as an optional, pluggable concern (was BRIUD-trigger-only)  
**public\img\ComponentModel.png**  
&nbsp;- component-model diagram refreshed with the optional audit components  

### hauberk/changes.txt


**06/10/2026** mir0n  v1.2.7 -- SimulationInfo descriptions trimmed to the hauberk list 90-char cap  
**simulations.MessageLossSimulation**  
&nbsp;- @SimulationInfo trimmed 112 -> 86 chars (SimulationCatalogContractTest.descriptionFitsTerminalWidth)  
**simulations.MessageLossTerminateSimulation**  
&nbsp;- @SimulationInfo trimmed 114 -> 85 chars  
**simulations.ResidueCleanupSimulation**  
&nbsp;- @SimulationInfo trimmed 105 -> 74 chars (dropped the -Dcleanup.prefix default-value note)  

**06/03/2026** mir0n  v1.2.7 -- PerformanceMatrix AIOOBE fix in the post-run summary  
**perf.PerformanceMatrix**  
&nbsp;- printSummary() made synchronized (same monitor as add()) so a straggler response cannot grow a  
&nbsp;   request's row list mid-summary; column() snapshots rows.size() once so the loop bound never exceeds  
&nbsp;   the allocated array (was AIOOBE at high sample counts, aborting the run summary / CSV / HTML report)  

---

## Commits

```

-- 2026-06-10 | commit: e2814cd | mir0n.the.programmer | v1.2.7-2606.1021  v1.2.7 -- e2e: Details ESC-close test hardened for remote latency --
M	doc/release_notes.txt
M	e2e-test/tests/07-details.spec.ts
 2 files changed, 14 insertions(+), 7 deletions(-)

-- 2026-06-10 | commit: b7cf106 | mir0n.the.programmer | v1.27 finalization --
M	README.md
M	backend/package.json
M	doc/release_notes.txt
M	frontend/package.json
M	hauberk/changes.txt
M	hauberk/pom.xml
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossTerminateSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
 9 files changed, 40 insertions(+), 6 deletions(-)


-- 2026-06-10 | commit: 6d0d8a6 | mir0n.the.programmer | v1.2.7-2606.1000  v1.2.7 landing-page audit refresh + e2e account-pick fix --
M	doc/release_notes.txt
M	e2e-test/tests/11-deposit.spec.ts
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
 6 files changed, 52 insertions(+), 15 deletions(-)

-- 2026-06-08 | commit: 90122db | mir0n.the.programmer | Update ci.yml --
M	.github/workflows/ci.yml
 1 file changed, 4 insertions(+), 4 deletions(-)

-- 2026-06-08 | commit: ca24006 | mir0n.the.programmer | miss lock files --
A	backend/package-lock.json
A	frontend/package-lock.json
 2 files changed, 15331 insertions(+)

-- 2026-06-08 | commit: 33e9906 | mir0n.the.programmer | prepare Git actions --
A	.github/scripts/ci-backend.sh
A	.github/scripts/ci-frontend.sh
A	.github/workflows/ci.yml
 3 files changed, 93 insertions(+)

-- 2026-06-06 | commit: 14713fa | mir0n.the.programmer | v1.2.7-2606.0615  v1.2.7 hauberk PerformanceMatrix summary fix --
M	doc/release_notes.txt
M	hauberk/changes.txt
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/perf/PerformanceMatrix.java
 3 files changed, 19 insertions(+), 3 deletions(-)

-- 2026-06-02 | commit: 154b687 | mir0n.the.programmer | Create report_v1.2.6.md --
A	doc/reports/report_v1.2.6.md
 1 file changed, 140 insertions(+)

```

---

## Files Modified

```
A	.github/scripts/ci-backend.sh
A	.github/scripts/ci-frontend.sh
A	.github/workflows/ci.yml
M	README.md
A	backend/package-lock.json
M	backend/package.json
M	doc/release_notes.txt
A	doc/reports/report_v1.2.6.md
M	e2e-test/tests/07-details.spec.ts
M	e2e-test/tests/11-deposit.spec.ts
A	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	hauberk/changes.txt
M	hauberk/pom.xml
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/perf/PerformanceMatrix.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossTerminateSimulation.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
 22 files changed, 15689 insertions(+), 31 deletions(-)
```

---

*From `v1.2.6` till `v1.2.7`*
