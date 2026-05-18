# Release Report: v1.2.3 → v1.2.4

**Repo:** `esquire.explorer/develop`  
**Top commit:** `1c7f97a`

---

## Release Notes

### doc/release_notes.txt


**v1.2.4-2605.1616** Hauberk Gatling harness; tree-diff endpoints; landing page two-host architecture  
&nbsp;: Feature:     explorer/hauberk: new subproject: chainmail armor based on Gatling 3.13: stress / load / smoke / race-repro  
&nbsp;                (26 reusable Chains; 17 Simulations; PerformanceMatrix CSV + per-URL summary);  
&nbsp;: Feature:     rest/ regenerated -- /esq-cmd-tree (enyMan FK walk) and /esq-tree (biztree H2 cache)  
&nbsp;                endpoints; EsqTreeNode.entityPath field (diff axis for race-repro CompareTrees)  
&nbsp;: Improvement: landing-page Architecture tab updated for v1.2.4 -- two public hosts called out:  
&nbsp;                esquire.mir0n.pro (administrative GUI, BFF + SPA)  
&nbsp;                api.esquire.mir0n.pro (public REST API, gateway direct, Bearer JWT per request)  
&nbsp;  Components:   hauberk (new), frontend, backend (unit test added)  

---

## Code Changes

### frontend/src/changes.txt


**05/17/2026** mir0n  v1.2.4 landing-page Architecture tab updated for two-host model  
**explorer\flatTree\app-shell.html**  
&nbsp;- Architecture heading bumped: v1.2.3 -> v1.2.4  

**05/14/2026** mir0n  v1.2.4 rest/ regenerated for tree-diff endpoints  
**rest\api\*.ts**  
&nbsp;- regenerated: new endpoints exposed  

### hauberk/changes.txt

hauberk changes  

**05/17/2026** created: Gatling-based stress / load / smoke / race-repro harness  
auth.KcTokenClient  
&nbsp;- plain-Java client_credentials grant against KC /token  
**auth.RefreshableToken**  
&nbsp;- thread-safe access-token holder; lazy first fetch; auto-refresh at TTL-30s  
**config.HauberkConfig**  
&nbsp;- typed config (endpoints, KC client+secret, playground id, prepare/move/super knobs, metrics)  
&nbsp;    loaded from hauberk.properties + optional overlay via --config  
&nbsp;- added tokenRelay.type (plain | vanilla | phantom) + isBasicAuth() + basicAuthHeader()  
&nbsp;    so the harness can present HTTP Basic at the edge for Vanilla Token Relay runs; overlay javadoc decoupled from JWS+ naming  
**config.EntityKinds**  
&nbsp;- kind-code constants (ORG=20, USR_CLIENT=34, ACCT_CLIENT=50, TX_DEPOSIT/WITHDRAW/TRANSFER, ...)  
**health.HealthPreCheck**  
&nbsp;- KC well-known + gateway health probes run before sim start; aborts on failure  
&nbsp;- auth-path probe branches on HauberkConfig.AUTH_MODE  
&nbsp;    presents Basic for Vanilla Token Relay, Bearer otherwise;  
**perf.PerformanceMatrix**  
&nbsp;- per-response transformResponse hook capturing the four observability headers  
&nbsp;   (X-Response-Time / Esq-Gw-Inner-Time / Esq-Srv-Outer-Time / Esq-Srv-Inner-Time);  
**cli.HauberkCli**  
&nbsp;- picocli @Command root entry point; dispatches to subcommands  
**cli.RunCommand**  
&nbsp;- programmatic Gatling launch with --metrics, --output, --config, --times, shape knobs  
**cli.ListCommand**  
&nbsp;- catalogue of discovered Simulations with @SimulationInfo descriptions  
**cli.SummaryCommand**  
&nbsp;- per-URL percentile summary from a saved perf-matrix CSV  
**cli.DiffCommand**  
&nbsp;- side-by-side per-URL diff of two perf-matrix CSV snapshots  
**cli.CsvSnapshot**  
&nbsp;- in-memory snapshot of a perf-matrix CSV (YAML preamble + row arrays)  
**cli.SimulationCatalog**  
&nbsp;- classpath scanner for concrete Simulation classes; resolves short / kebab / FQCN names  
**chain.***  
&nbsp;- 26 atomic ChainBuilder building blocks:  
**simulations.SimulationInfo**  
&nbsp;- SimulationInfo: class-level annotation carrying the one-line catalog description (read reflectively by ListCommand)  
**simulations.HauberkSimulation**  
&nbsp;- abstract base for every hauberk Simulation -- pulls up lazy RefreshableToken,  
&nbsp;   instrumented httpProtocol with PerformanceMatrix, and after() perf-matrix flush  
&nbsp;- Authorization header branches on HauberkConfig.AUTH_MODE --  
&nbsp;   Basic for Vanilla Token Relay, Bearer (KC JWT) otherwise  
**simulations.LoadScenarios**  
&nbsp;- shared scenario library (READ/UPDATE/CREATE/MOVE/TX) used by SuperLoad and the five standalone *LoadSimulation variants  
**simulations.SmokeSimulation**  
&nbsp;- single-VU wiring check (KC token + one GET /esq-kinds)  
**simulations.EntitySmokeSimulation**  
&nbsp;- end-to-end entity walk -- every CRUD Chain exercised sequentially by a single VU  
**simulations.CleanHouseSimulation**  
&nbsp;- stateless name-driven teardown -- find hauberk-office-smoke + delete its subtree  
**simulations.CompareTreesSimulation**  
&nbsp;- standalone CompareTrees runner across the playground subtree  
**simulations.PrepareForAnythingSimulation**  
&nbsp;- load-test playground builder (D nested offices x N users x M accounts)  
**simulations.MoveSmokeSimulation**  
&nbsp;- /esq-move smoke for USR + ORG re-parenting on a D-deep chain  
**simulations.KcIntegrationSmokeSimulation**  
&nbsp;- access-profile end-to-end via enyMan + keySmith + kcMaster + KC + BFF login  
**simulations.CreateLoadSimulation**  
&nbsp;- standalone variants of the create load scenarios  
**simulations.ReadLoadSimulation**  
&nbsp;- standalone variants of the read load scenarios  
**simulations.UpdateLoadSimulation**  
&nbsp;- standalone variants of the update load scenarios  
**simulations.MoveLoadSimulation**  
&nbsp;- standalone variants of the move load scenarios  
**simulations.TxLoadSimulation**  
&nbsp;- standalone variants of the deposit-withdrawal load scenarios  
simulations.SuperLoadSimulation:  
&nbsp;- all 5 LoadScenarios in parallel for super.duration.seconds  
**simulations.RaceCacheLoadSimulation**  
&nbsp;- Race repro (cache-load race); self-validating PASS/FAIL  
**simulations.RaceMoveCreateSimulation**  
&nbsp;- Race repro (move + concurrent create path race); self-validating PASS/FAIL  
**simulations.ResidueCleanupSimulation**  
&nbsp;- targeted residue purge for hauberk-office-smoke leftovers  

---

## Commits

```

-- 2026-05-17 | commit: 1c7f97a | mir0n.the.programmer | v1.2.4 Hauberk Gatling harness; tree-diff endpoints; landing page two-host architecture --
M	README.md
M	backend/package.json
A	backend/test/auth/tokens.test.ts
A	backend/test/config.test.ts
A	backend/test/proxy/cache.test.ts
A	backend/test/util/trace.test.ts
M	doc/release_notes.txt
M	e2e-test/e2e-k8s.bat
M	frontend/README.md
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/rest/api/esquire.service.ts
M	frontend/src/rest/model/acctTransactionSimple.ts
M	frontend/src/rest/model/esqTreeNode.ts
A	hauberk/README.md
A	hauberk/changes.txt
A	hauberk/hauberk-k8s.properties
A	hauberk/hauberk-oke.properties
A	hauberk/hauberk.cmd
A	hauberk/hauberk.properties
A	hauberk/pom.xml
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/KcTokenClient.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/RefreshableToken.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupOfficeByName.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CloseAccount.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CompareTrees.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ConnectUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateAccount.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateOffice.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateSubOffice.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DeleteEntity.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Deposit.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DisconnectUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/EnsureOffice.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LoginViaBff.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupAccessProfile.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupOfficeIdByName.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/MoveEntity.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PickRandomFromPool.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchAccounts.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchUsers.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAccounts.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetail.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetails.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUsers.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Transfer.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/UpdateUserAddress.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Withdrawal.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/CsvSnapshot.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/DiffCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/HauberkCli.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/ListCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/RunCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SimulationCatalog.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SummaryCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/EntityKinds.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/health/HealthPreCheck.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/marker.txt
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/perf/PerformanceMatrix.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CleanHouseSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CompareTreesSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CreateLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/EntitySmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HauberkSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcIntegrationSmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveSmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/PrepareForAnythingSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceCacheLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ReadLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SimulationInfo.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SuperLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/TxLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/UpdateLoadSimulation.java
A	hauberk/src/test/java/pro/mir0n/esquire/hauberk/simulations/SimulationCatalogContractTest.java
D	media/83817d896833ef994ed6cdb2b8ddd63a.jpeg
M	openapi-generate/esqEsquireApi.yaml
 85 files changed, 6474 insertions(+), 38 deletions(-)

-- 2026-05-08 | commit: b4a64c5 | mir0n.the.programmer | Create report_v1.2.3.md --
A	doc/reports/report_v1.2.3.md
 1 file changed, 255 insertions(+)
```

---

## Files Modified

```
M	README.md
M	backend/package.json
A	backend/test/auth/tokens.test.ts
A	backend/test/config.test.ts
A	backend/test/proxy/cache.test.ts
A	backend/test/util/trace.test.ts
M	doc/release_notes.txt
A	doc/reports/report_v1.2.3.md
M	e2e-test/e2e-k8s.bat
M	frontend/README.md
M	frontend/package.json
M	frontend/public/img/ComponentModel.png
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/rest/api/esquire.service.ts
M	frontend/src/rest/model/acctTransactionSimple.ts
M	frontend/src/rest/model/esqTreeNode.ts
A	hauberk/README.md
A	hauberk/changes.txt
A	hauberk/hauberk-k8s.properties
A	hauberk/hauberk-oke.properties
A	hauberk/hauberk.cmd
A	hauberk/hauberk.properties
A	hauberk/pom.xml
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/KcTokenClient.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/RefreshableToken.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupOfficeByName.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CloseAccount.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CompareTrees.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ConnectUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateAccount.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateOffice.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateSubOffice.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DeleteEntity.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Deposit.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DisconnectUser.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/EnsureOffice.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LoginViaBff.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupAccessProfile.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupOfficeIdByName.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/MoveEntity.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PickRandomFromPool.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchAccounts.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchUsers.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAccounts.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetail.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetails.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUsers.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Transfer.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/UpdateUserAddress.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Withdrawal.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/CsvSnapshot.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/DiffCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/HauberkCli.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/ListCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/RunCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SimulationCatalog.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SummaryCommand.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/EntityKinds.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/health/HealthPreCheck.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/marker.txt
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/perf/PerformanceMatrix.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CleanHouseSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CompareTreesSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CreateLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/EntitySmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HauberkSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcIntegrationSmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveSmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/PrepareForAnythingSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceCacheLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ReadLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SimulationInfo.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SmokeSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SuperLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/TxLoadSimulation.java
A	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/UpdateLoadSimulation.java
A	hauberk/src/test/java/pro/mir0n/esquire/hauberk/simulations/SimulationCatalogContractTest.java
D	media/83817d896833ef994ed6cdb2b8ddd63a.jpeg
M	openapi-generate/esqEsquireApi.yaml
 86 files changed, 6729 insertions(+), 38 deletions(-)
```

---

*From `v1.2.3` till `v1.2.4`*
