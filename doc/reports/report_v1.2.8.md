# Release Report: v1.2.7 → v1.2.8

**Repo:** `esquire.explorer/develop`  
**Top commit:** `fdf7820`

---

## Release Notes

### doc/release_notes.txt


**v1.2.8-2606.1216**  v1.2.8 -- e2e coverage for the system entity flag (anti-deletion)  
&nbsp;: Feature:     e2e 15-system-entity-protection asserts a delete of a system-flagged office/user is blocked (409)  
&nbsp;   Components:   e2e  

---

## Code Changes

---

## Commits

```

-- 2026-06-19 | commit: fdf7820 | mir0n.the.programmer | v1.2.8 -- version finalizing --
M	README.md
M	frontend/src/explorer/flatTree/app-shell.html
 2 files changed, 29 insertions(+), 33 deletions(-)

-- 2026-06-18 | commit: 40852cb | mir0n.the.programmer | auKeep vs xx-rod --
M	frontend/public/img/ComponentModel.png
M	frontend/public/logo/gateway.svg
A	frontend/public/logo/keep.svg
D	frontend/public/logo/x-rod.svg
M	frontend/src/explorer/flatTree/app-shell.html
 5 files changed, 327 insertions(+), 370 deletions(-)

-- 2026-06-12 | commit: 201b75f | mir0n.the.programmer | v1.2.8 -- e2e coverage for the system entity flag (anti-deletion) --
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
A	e2e-test/tests/15-system-entity-protection.spec.ts
 3 files changed, 52 insertions(+)

-- 2026-06-12 | commit: 378bb22 | mir0n.the.programmer | esquire logo updated, icons added --
M	favicon.ico
A	frontend/public/helm.svg
M	frontend/public/img/ComponentModel.png
M	frontend/public/img/folders/system.ico
M	frontend/public/img/og-banner.png
M	frontend/public/img/sysadmin.ico
A	frontend/public/logo/activemq.png
A	frontend/public/logo/angular.svg
A	frontend/public/logo/bizTree.png
A	frontend/public/logo/enyMan.3.png
A	frontend/public/logo/esquire.png
A	frontend/public/logo/gateway.svg
A	frontend/public/logo/gatling.svg
A	frontend/public/logo/h2.svg
A	frontend/public/logo/hauberk.svg
A	frontend/public/logo/java.svg
A	frontend/public/logo/kafka.svg
A	frontend/public/logo/kcMaster.png
A	frontend/public/logo/keySmith.3.png
A	frontend/public/logo/keycloak.png
A	frontend/public/logo/node.js.svg
A	frontend/public/logo/oracle.svg
A	frontend/public/logo/pac-man.svg
A	frontend/public/logo/postgres.svg
A	frontend/public/logo/redis.svg
A	frontend/public/logo/spring-boot.svg
A	frontend/public/logo/x-rod.svg
M	frontend/public/main.ico
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/index.html
 30 files changed, 1388 insertions(+), 22 deletions(-)

-- 2026-06-10 | commit: db6ce91 | mir0n.the.programmer | v1.2.8 bump --
M	backend/package.json
M	e2e-test/package.json
M	frontend/package.json
M	hauberk/pom.xml
 4 files changed, 4 insertions(+), 4 deletions(-)

-- 2026-06-10 | commit: 83f74cd | mir0n.the.programmer | Create report_v1.2.7.md --
A	doc/reports/report_v1.2.7.md
 1 file changed, 162 insertions(+)
```

---

## Files Modified

```
M	README.md
M	backend/package.json
M	doc/release_notes.txt
A	doc/reports/report_v1.2.7.md
M	e2e-test/e2e-test.scope.md
M	e2e-test/package.json
A	e2e-test/tests/15-system-entity-protection.spec.ts
M	favicon.ico
M	frontend/package.json
A	frontend/public/helm.svg
M	frontend/public/img/ComponentModel.png
M	frontend/public/img/folders/system.ico
M	frontend/public/img/og-banner.png
M	frontend/public/img/sysadmin.ico
A	frontend/public/logo/activemq.png
A	frontend/public/logo/angular.svg
A	frontend/public/logo/bizTree.png
A	frontend/public/logo/enyMan.3.png
A	frontend/public/logo/esquire.png
A	frontend/public/logo/gateway.svg
A	frontend/public/logo/gatling.svg
A	frontend/public/logo/h2.svg
A	frontend/public/logo/hauberk.svg
A	frontend/public/logo/java.svg
A	frontend/public/logo/kafka.svg
A	frontend/public/logo/kcMaster.png
A	frontend/public/logo/keep.svg
A	frontend/public/logo/keySmith.3.png
A	frontend/public/logo/keycloak.png
A	frontend/public/logo/node.js.svg
A	frontend/public/logo/oracle.svg
A	frontend/public/logo/pac-man.svg
A	frontend/public/logo/postgres.svg
A	frontend/public/logo/redis.svg
A	frontend/public/logo/spring-boot.svg
M	frontend/public/main.ico
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/index.html
M	hauberk/pom.xml
 39 files changed, 1592 insertions(+), 59 deletions(-)
```

---

*From `v1.2.7` till `v1.2.8`*
