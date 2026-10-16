# Release Report: v1.2.16 → v2.0.0

**Repo:** `esquire.explorer/develop2`  
**Top commit:** `a1223a0`

---

## Release Notes

### doc/release_notes.txt


**v2.0.0-2610.1615**  v2.0.0 -- the load harness leaves the explorer  
&nbsp;: Refactoring: the load-test harness is a product of its own: armoury-hauberk  
&nbsp;: Refactoring: the Esquire load tests moved to Esquire services: hauberk  
&nbsp;   Components:   hauberk  

---

## Code Changes

### backend/src/changes.txt


**10/16/2026** mir0n  v2.0.0 -- version 2.0.0  
**package.json**  
&nbsp;- version 2.0.0  

### frontend/src/changes.txt


**10/16/2026** mir0n  v2.0.0 -- version 2.0.0  
**package.json**  
&nbsp;- version 2.0.0  
**package-lock.json**  
&nbsp;- version 2.0.0  
**index.html**  
&nbsp;- softwareVersion 2.0.0  
&nbsp;- grid-template-rows: auto -> 1fr (explorer fills space between toolbars on resize)  
&nbsp;- setUserId() called at profile load -- informs mill of logged-in userId at logon  

**03/16/2026** mir0n  let -> var convention; subscribe error blocks removed  
&nbsp;- let -> var for ret variable (coding convention)  
&nbsp;- profile converted to Angular signal -- fixes NG0100 ExpressionChangedAfterChecked on faceIcon/faceName  
&nbsp;- callApiMill and dictionary initialized before await EsqObjectKindFactory.init() -- fixes "CallApiMill not initialized" race  
&nbsp;- checkLoginIframe: true -> false (cross-port iframe unreliable with self-signed certs)  
&nbsp;- onLoad stays 'check-sso' -- session detection still works via silentCheckSsoRedirectUri  

**02/18/2026** mir0n Wire Save to REST -- esquireCmdSave & esquireKeySave  

### hauberk/changes.txt


---

## Commits

```

-- 2026-10-16 | commit: a1223a0 | mir0n.the.programmer | v2.0 Initial --
M	README.md
M	backend/README.md
M	backend/package.json
M	backend/src/changes.txt
M	backend/src/proxy/apiProxy.ts
A	doc/media/access-profile.jpg
A	doc/media/context-menu.jpg
M	doc/release_notes.txt
M	e2e-test/.gitignore
M	e2e-test/e2e-test.scope.md
R100	e2e-test/playwright-report/--placeholder--	e2e-test/html-report/--placeholder--
M	e2e-test/package.json
M	e2e-test/playwright.config.ts
M	e2e-test/tests/02-login.spec.ts
M	e2e-test/tests/07-details.spec.ts
M	e2e-test/tests/09-move-entity.spec.ts
M	e2e-test/tests/10-delete-entity.spec.ts
M	e2e-test/tests/12-withdrawal.spec.ts
M	e2e-test/tests/13-transfer.spec.ts
M	e2e-test/tests/14-error-handling.spec.ts
M	e2e-test/tests/15-system-entity-protection.spec.ts
M	frontend/README.md
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/landing/architecture.html
M	frontend/public/landing/vision.html
M	frontend/public/landing/vs-competition.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/who-needs-it.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/index.html
M	frontend/src/test/group3/ExplorerComponent.spec.ts
M	frontend/src/test/test.structure.md
D	hauberk/README.md
D	hauberk/changes.txt
D	hauberk/hauberk-M.properties
D	hauberk/hauberk-S.properties
D	hauberk/hauberk-aws.properties
D	hauberk/hauberk-compact.properties
D	hauberk/hauberk-k8s-compact.properties
D	hauberk/hauberk-k8s.properties
D	hauberk/hauberk-oke.properties
D	hauberk/hauberk.cmd
D	hauberk/hauberk.properties
D	hauberk/k8s-smoke.bat
D	hauberk/oke-perf-matrix.bat
D	hauberk/oke-perf-matrix.ps1
D	hauberk/perf-matrix-report.py
D	hauberk/perf-matrix.bat
D	hauberk/perf-matrix.ps1
D	hauberk/perf-pairs.ps1
D	hauberk/pom.xml
D	hauberk/smoke-5.bat
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/KcTokenClient.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/RefreshableToken.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupKcOrphans.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupOfficeByName.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CloseAccount.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Cmd.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CompareTrees.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ConnectUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateAccount.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateOffice.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateSubOffice.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DeleteEntity.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Deposit.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DisconnectUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/EnsureOffice.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ForceSweep.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/KcAdminAuth.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LoginViaBff.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupAccessProfile.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupOfficeIdByName.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/MoveEntity.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PickRandomFromPool.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchAccounts.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchUsers.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAccounts.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAcctDetail.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheRoot.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeRoot.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetail.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetails.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUsers.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Transfer.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/UpdateUserAddress.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitBizTreeDown.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitCacheReady.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Withdrawal.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/CsvSnapshot.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/DiffCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/HauberkCli.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/KcReconcileCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/ListCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/RunCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SimulationCatalog.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SummaryCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/EntityKinds.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/health/HealthPreCheck.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/marker.txt
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/perf/PerformanceMatrix.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/reconcile/KcRecover.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CleanHouseSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CompareTreesSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CreateLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/EntitySmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HaTimeoutSmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HauberkSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcCleanupSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcIntegrationSmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossTerminateSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveSmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/PrepareForAnythingSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceCacheLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSingleShotSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ReadLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SimulationInfo.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SuperLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/TxLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/UpdateLoadSimulation.java
D	hauberk/src/test/java/pro/mir0n/esquire/hauberk/simulations/SimulationCatalogContractTest.java
 134 files changed, 232 insertions(+), 10052 deletions(-)

-- 2026-10-12 | commit: 0973c7a | mir0n.the.programmer | Create report_v1.2.16.md --
A	doc/reports/report_v1.2.16.md
 1 file changed, 166 insertions(+)
```

---

## Files Modified

```
M	README.md
M	backend/README.md
M	backend/package.json
M	backend/src/changes.txt
M	backend/src/proxy/apiProxy.ts
A	doc/media/access-profile.jpg
A	doc/media/context-menu.jpg
M	doc/release_notes.txt
A	doc/reports/report_v1.2.16.md
M	e2e-test/.gitignore
M	e2e-test/e2e-test.scope.md
R100	e2e-test/playwright-report/--placeholder--	e2e-test/html-report/--placeholder--
M	e2e-test/package.json
M	e2e-test/playwright.config.ts
M	e2e-test/tests/02-login.spec.ts
M	e2e-test/tests/07-details.spec.ts
M	e2e-test/tests/09-move-entity.spec.ts
M	e2e-test/tests/10-delete-entity.spec.ts
M	e2e-test/tests/12-withdrawal.spec.ts
M	e2e-test/tests/13-transfer.spec.ts
M	e2e-test/tests/14-error-handling.spec.ts
M	e2e-test/tests/15-system-entity-protection.spec.ts
M	frontend/README.md
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/landing/architecture.html
M	frontend/public/landing/vision.html
M	frontend/public/landing/vs-competition.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/who-needs-it.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/index.html
M	frontend/src/test/group3/ExplorerComponent.spec.ts
M	frontend/src/test/test.structure.md
D	hauberk/README.md
D	hauberk/changes.txt
D	hauberk/hauberk-M.properties
D	hauberk/hauberk-S.properties
D	hauberk/hauberk-aws.properties
D	hauberk/hauberk-compact.properties
D	hauberk/hauberk-k8s-compact.properties
D	hauberk/hauberk-k8s.properties
D	hauberk/hauberk-oke.properties
D	hauberk/hauberk.cmd
D	hauberk/hauberk.properties
D	hauberk/k8s-smoke.bat
D	hauberk/oke-perf-matrix.bat
D	hauberk/oke-perf-matrix.ps1
D	hauberk/perf-matrix-report.py
D	hauberk/perf-matrix.bat
D	hauberk/perf-matrix.ps1
D	hauberk/perf-pairs.ps1
D	hauberk/pom.xml
D	hauberk/smoke-5.bat
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/KcTokenClient.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/auth/RefreshableToken.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupKcOrphans.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CleanupOfficeByName.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CloseAccount.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Cmd.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CompareTrees.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ConnectUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateAccount.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateOffice.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateSubOffice.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/CreateUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DeleteEntity.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Deposit.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/DisconnectUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/EnsureOffice.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ForceSweep.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/KcAdminAuth.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LoginViaBff.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupAccessProfile.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/LookupOfficeIdByName.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/MoveEntity.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PickRandomFromPool.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchAccounts.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/PoolFetchUsers.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAccounts.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadAcctDetail.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheRoot.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadCacheUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeRoot.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadTreeUser.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetail.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUserDetails.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/ReadUsers.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Transfer.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/UpdateUserAddress.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitBizTreeDown.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/WaitCacheReady.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/chain/Withdrawal.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/CsvSnapshot.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/DiffCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/HauberkCli.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/KcReconcileCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/ListCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/RunCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SimulationCatalog.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/cli/SummaryCommand.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/EntityKinds.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/health/HealthPreCheck.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/marker.txt
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/perf/PerformanceMatrix.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/reconcile/KcRecover.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CleanHouseSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CompareTreesSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/CreateLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/EntitySmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HaTimeoutSmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/HauberkSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcCleanupSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/KcIntegrationSmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/LoadScenarios.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MessageLossTerminateSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/MoveSmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/PrepareForAnythingSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceCacheLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateKcSingleShotSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/RaceMoveCreateSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ReadLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/ResidueCleanupSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SimulationInfo.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SmokeSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/SuperLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/TxLoadSimulation.java
D	hauberk/src/main/java/pro/mir0n/esquire/hauberk/simulations/UpdateLoadSimulation.java
D	hauberk/src/test/java/pro/mir0n/esquire/hauberk/simulations/SimulationCatalogContractTest.java
 135 files changed, 398 insertions(+), 10052 deletions(-)
```

---

*From `v1.2.16` till `v2.0.0`*
