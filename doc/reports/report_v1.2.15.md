# Release Report: v1.2.14 → v1.2.15

**Repo:** `esquire.explorer/develop`  
**Top commit:** `9f02bdc`

---

## Release Notes

### doc/release_notes.txt


**v1.2.15-2609.0700**  v1.2.15 -- the reconcile check reads the stack database  
&nbsp;   Components:   hauberk  

**v1.2.15-2609.0523**  v1.2.15 -- logging out lets you log in as somebody else  
&nbsp;: Fix:         logging out ends the KeyCloak session as well  
&nbsp;: New:         e2e 22-role-state-login signs in with no role, with an admin role but no TREE, and  
&nbsp;                 with TREE but no admin role, and asserts what each one is told  
&nbsp;: New:         e2e 23-logout-switch-user asserts KeyCloak asks for credentials after a logout  
&nbsp;   Components:   backend,  
&nbsp;                 frontend,  
&nbsp;                 e2e  

---

## Code Changes

### backend/src/changes.txt


**09/05/2026** mir0n  v1.2.15 -- logout reaches KeyCloak as a navigation  
**src\auth\routes.ts**  
&nbsp;- logoutHandler() answers { endSessionUrl } instead of redirecting to it  

### frontend/src/changes.txt


**09/05/2026** mir0n  v1.2.15 -- logout reaches KeyCloak as a navigation  
**explorer\flatTree\app-shell.ts**  
&nbsp;- logout() navigates to the endSessionUrl the BFF returns  

### hauberk/changes.txt


**09/07/2026** mir0n  v1.2.15 -- kc-reconcile reads every environment  
**KcRecover.java**  
&nbsp;- adminToken() takes a client_credentials token on the realm admin client instead of a  
&nbsp;   master-realm password grant  
**HauberkConfig.java**  
&nbsp;- added KC_ADMIN_CLIENT_ID (kc.admin.client.id, default esq-kcMaster) and KC_ADMIN_SECRET, the  
&nbsp;   latter read from the environment only (KC_ADMIN_SECRET / KCMASTER_ADMIN_SECRET)  
**hauberk-oke.properties**  
&nbsp;- pg.url added: the OKE database over a port-forward on 35432  
**hauberk-aws.properties**  
&nbsp;- pg.url to the in-pod postgres over a port-forward on 45432; cluster and statefulset in cmd.*  
&nbsp;   moved to esquire-aws-compact and esquire-gateward  

**09/06/2026** mir0n  v1.2.15 -- kc-reconcile reads the stack database  
**hauberk.properties**  
&nbsp;- pg.url port 5432 -> 5433, the port the compose stack publishes its own postgres on  
**hauberk-compact.properties**  
&nbsp;- pg.url port 5432 -> 5433, the port the compose stack publishes its own postgres on  

---

## Commits

```

-- 2026-09-07 | commit: 9f02bdc | mir0n.the.programmer | v1.2.15 -- the reconcile check reads the stack database --
M	README.md
M	doc/release_notes.txt
M	frontend/public/landing/architecture.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/why-it-matters.html
M	hauberk/changes.txt
M	hauberk/hauberk-aws.properties
M	hauberk/hauberk-compact.properties
M	hauberk/hauberk-oke.properties
M	hauberk/hauberk.properties
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/reconcile/KcRecover.java
 12 files changed, 91 insertions(+), 59 deletions(-)


-- 2026-09-06 | commit: 75e368e | mir0n.the.programmer | v1.2.15 -- logging out lets you log in as somebody else --
M	README.md
M	backend/package.json
M	backend/src/auth/routes.ts
M	backend/src/changes.txt
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
M	e2e-test/helpers/auth.ts
A	e2e-test/package-lock.json
M	e2e-test/package.json
A	e2e-test/tests/22-role-state-login.spec.ts
A	e2e-test/tests/23-logout-switch-user.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/index.html
 16 files changed, 487 insertions(+), 20 deletions(-)

-- 2026-09-02 | commit: 09697ea | mir0n.the.programmer | Create report_v1.2.14.md --
A	doc/reports/report_v1.2.14.md
 1 file changed, 122 insertions(+)

```

---

## Files Modified

```
M	README.md
M	backend/package.json
M	backend/src/auth/routes.ts
M	backend/src/changes.txt
M	doc/release_notes.txt
A	doc/reports/report_v1.2.14.md
M	e2e-test/e2e-test.scope.md
M	e2e-test/helpers/auth.ts
A	e2e-test/package-lock.json
M	e2e-test/package.json
A	e2e-test/tests/22-role-state-login.spec.ts
A	e2e-test/tests/23-logout-switch-user.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/landing/architecture.html
M	frontend/public/landing/what-is-it.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/index.html
M	hauberk/changes.txt
M	hauberk/hauberk-aws.properties
M	hauberk/hauberk-compact.properties
M	hauberk/hauberk-oke.properties
M	hauberk/hauberk.properties
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/config/HauberkConfig.java
M	hauberk/src/main/java/pro/mir0n/esquire/hauberk/reconcile/KcRecover.java
 27 files changed, 700 insertions(+), 79 deletions(-)
```

---

*From `v1.2.14` till `v1.2.15`*
