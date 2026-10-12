# Release Report: v1.2.15 → v1.2.16

**Repo:** `esquire.explorer/develop`  
**Top commit:** `b200c55`

---

## Release Notes

### doc/release_notes.txt


**v1.2.16-2610.1117**  v1.2.16 -- the landing page on a phone, and one operation per load cell  
&nbsp;: Fix:         the landing page fits a phone screen  
&nbsp;: Fix:         the landing header keeps the login button on the screen  
&nbsp;: New:         the load harness drives one operation on its own  
&nbsp;- - reading the tree from the service that owns it or from the cache,  
&nbsp;                 the whole tree or one customer's, and reading one account  
&nbsp;- - so a number names that operation instead of a mixture  
&nbsp;: New:         the load harness measures an operation on both deployment shapes back to back  
&nbsp;   Components:   frontend,  
&nbsp;                 hauberk  

---

## Code Changes

### frontend/src/changes.txt


**10/11/2026** mir0n  v1.2.16 -- the landing page fits a phone  
**styles.scss**  
&nbsp;- work for mobile  
**explorer\flatTree\app-shell.scss**  
&nbsp;- work for mobile  

### hauberk/changes.txt


**10/11/2026** mir0n  v1.2.16 -- one operation per cell: the read scenarios, and the paired driver  
chain.ReadTreeRoot  (new)  
&nbsp;- Chain GET /esq-cmd-tree on the driver's own root office; used by Tree load  
chain.ReadTreeUser  (new)  
&nbsp;- Chain GET /esq-cmd-tree on one client user's subtree; used by TreeSmall load  
chain.ReadCacheRoot  (new)  
&nbsp;- Chain GET /esq-tree on the driver's own root, served from the bizTree cache; used by Cache load  
chain.ReadCacheUser  (new)  
&nbsp;- Chain GET /esq-tree on one customer's subtree from the bizTree cache; used by CacheSmall load  
chain.ReadAcctDetail  (new)  
&nbsp;- Chain GET /esq-cmd?kind=50&id=pickedAcctId for a single account; used by ReadAcct load  
**simulations.LoadScenarios**  
&nbsp;- five read scenarios added: TREE (ReadTreeRoot), TREE_SMALL (PoolFetchUsers +  
&nbsp;   PickRandomFromPool.userChain + ReadTreeUser), CACHE (ReadCacheRoot), CACHE_SMALL (PoolFetchUsers +  
&nbsp;   PickRandomFromPool.userChain + ReadCacheUser) and READ_ACCT (PoolFetchAccounts +  
&nbsp;   PickRandomFromPool.acctChain + ReadAcctDetail). The three pooled ones carry the same  
&nbsp;   exitHereIfFailed() between the setup and the .forever() loop  
**simulations.SuperLoadSimulation**  
&nbsp;- TREE, READ_ACCT, TREE_SMALL, CACHE and CACHE_SMALL join the parallel populations, each injected only  
&nbsp;   when its worker count is above zero; the nothing-to-run guard sums all ten. The javadoc and  
&nbsp;   @SimulationInfo no longer say five  
**config.HauberkConfig**  
&nbsp;- added SUPER_TREE_WORKERS, SUPER_READACCT_WORKERS, SUPER_TREESMALL_WORKERS, SUPER_CACHE_WORKERS and  
&nbsp;   SUPER_CACHESMALL_WORKERS (super.tree.workers, super.readacct.workers, super.treesmall.workers,  
&nbsp;   super.cache.workers, super.cachesmall.workers), each requireIntMin0  
**cli.RunCommand**  
&nbsp;- added --tree, --readacct, --treesmall, --cache and --cachesmall, each overriding its  
&nbsp;   super.*.workers property  
**hauberk.properties**  
&nbsp;- super.tree.workers, super.readacct.workers, super.treesmall.workers, super.cache.workers and  
&nbsp;   super.cachesmall.workers, all 0  
**perf-matrix.ps1**  
&nbsp;- -Kinds: ONE KIND PER CELL, named "-", driving that scenario alone at -KindVus with every  
&nbsp;   other scenario passed an explicit 0; the kinds of a config share one build, and the names are checked  
&nbsp;   against KIND_NAMES  
&nbsp;- -MetricsVus / -MetricsDuration: a LIGHT --metrics leg pass per kind after the plateau cycles, never  
&nbsp;   sharing a cycle with one, landing as "--legs"  
&nbsp;- -PrepDepth / -PrepClients / -PrepAccounts replace the fixed 5 / 5 / 2 passed to prepare-for-anything  
&nbsp;- -PoolMax sets BIZTREE_H2_POOL_MAX on the workload that holds the tree cache (gateward in compact,  
&nbsp;   biztree in classic); -ServiceMetrics sets GW_SERVICE_METRICS_ENABLED on the gate after each build  
&nbsp;- Save-Result takes the duration the row was measured over, so a leg row's rps is not divided by the  
&nbsp;   plateau duration  
&nbsp;- the resume check matches the exact cell names this invocation produces instead of the config prefix,  
&nbsp;   and the discard sweeps the capture rows with the plateau rows  
perf-pairs.ps1  (new)  
&nbsp;- per-operation pairs: for each kind, the classic cell then the compact cell back to back, each one a  
&nbsp;   separate perf-matrix.ps1 invocation, with a full helm drain between cells, a refusal to measure while  
&nbsp;   any esquire pod survives the drain, and an optional -RecycleVm restart of the Docker VM  

---

## Commits

```

-- 2026-10-11 | commit: b200c55 | mir0n.the.programmer | Finalization --
M	backend/Dockerfile
M	frontend/public/landing/vision.html
 2 files changed, 24 insertions(+), 7 deletions(-)


-- 2026-10-11 | commit: 1cd89c1 | mir0n.the.programmer |  v1.2.16 -- the landing page on a phone, and one operation per load cell --
M	README.md
M	backend/package.json
M	doc/release_notes.txt
M	frontend/package.json
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/index.html
M	frontend/src/styles.scss
M	hauberk/changes.txt
M	hauberk/hauberk.properties
M	hauberk/perf-matrix.ps1
A	hauberk/perf-pairs.ps1
M	hauberk/pom.xml
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAcctDetail.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheRoot.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeRoot.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeUser.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/RunCommand.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SuperLoadSimulation.java
 22 files changed, 612 insertions(+), 26 deletions(-)

-- 2026-09-07 | commit: 2c1d53a | mir0n.the.programmer | Create report_v1.2.15.md --
A	doc/reports/report_v1.2.15.md
 1 file changed, 149 insertions(+)
```

---

## Files Modified

```
M	README.md
M	backend/Dockerfile
M	backend/package.json
M	doc/release_notes.txt
A	doc/reports/report_v1.2.15.md
M	frontend/package.json
M	frontend/public/landing/vision.html
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/index.html
M	frontend/src/styles.scss
M	hauberk/changes.txt
M	hauberk/hauberk.properties
M	hauberk/perf-matrix.ps1
A	hauberk/perf-pairs.ps1
M	hauberk/pom.xml
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAcctDetail.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheRoot.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeRoot.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeUser.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/RunCommand.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SuperLoadSimulation.java
 25 files changed, 785 insertions(+), 33 deletions(-)
```

---

*From `v1.2.15` till `v1.2.16`*
