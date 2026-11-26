# Release Report: v2.0.2 → HEAD

**Repo:** `esquire.explorer/develop2`  
**Top commit:** `5962bb6`

---

## Release Notes

### doc/release_notes.txt


**v2.0.3-2611.2518**  v2.0.3 -- code review: what the claims mode left behind  
&nbsp;: Refactoring: the login backend keeps no roles in the session and no longer reports them  
&nbsp;: Doc:         the backend README names the esq-angular client and says the token carries the login  
&nbsp;                 id only  
&nbsp;   Components:   backend  

**v2.0.3-2611.2419**  v2.0.3 -- OAuth only: the e2e suite tests one kind of sign-in  
&nbsp;: New:         e2e 20-direct-client asserts a direct client takes its own token, reads its own  
&nbsp;                 access profile and a protected read straight at the gateway, and that forged claim  
&nbsp;                 headers are replaced; it takes the place of 20-token-relay  
&nbsp;: New:         e2e 26-user-kinds asserts the main admin, a merchant user and a client user each  
&nbsp;                 sign in through the browser and read their own profile and tree  
&nbsp;: Config:      e2e 24-oauth-token (was 24-pure-oauth-token) keeps what the token proves, on the  
&nbsp;                 browser's own client; the two-client comparisons and timings are out  
&nbsp;: Config:      e2e 25-oauth-eviction (was 25-pure-oauth-eviction) runs in the default suite  
&nbsp;: Config:      e2e 22-role-state-login runs again, one way  
&nbsp;: Config:      e2e 15-system-entity-protection no longer checks the removed Test Driver S  
&nbsp;: Config:      the OKE e2e runs skip no spec  
&nbsp;: Doc:         e2e-test.scope.md: 15, 19, 20, 22, 24, 25 and 26  
&nbsp;   Components:   e2e  

**v2.0.3-2611.2300**  v2.0.3 -- pure OAuth only: the e2e specs the gateway change outdated are disabled  
&nbsp;: Config:      e2e 20-token-relay is disabled: the token relay left the gateway  
&nbsp;: Config:      e2e 22-role-state-login is disabled: on the pure OAuth default it passes only with  
&nbsp;                 PURE_OAUTH=true  
&nbsp;: Config:      e2e 24-pure-oauth-token: the claims client test is disabled -- esq-angular is a pure  
&nbsp;                 client now  
&nbsp;: Doc:         e2e-test.scope.md: 20, 22 and 24  
&nbsp;   Components:   e2e  

---

## Code Changes

### backend/src/changes.txt


**11/25/2026** mir0n  v2.0.3 -- code review: what the claims mode left behind  
**src\auth\routes.ts**  
&nbsp;- extractClaims() no longer reads realm_access; /auth/me answers no roles  

---

## Commits

```

-- 2026-11-26 | commit: 5962bb6 | mir0n.the.programmer | v2.0.3 -- finalization --
M	README.md
M	backend/package-lock.json
M	backend/package.json
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/img/ComponentModel.Compact.png
M	frontend/public/img/ComponentModel.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/index.html
 10 files changed, 45 insertions(+), 34 deletions(-)

-- 2026-11-25 | commit: 8db678c | mir0n.the.programmer | v2.0.3 -- code review: --
M	backend/README.md
M	backend/src/auth/routes.ts
M	backend/src/auth/sessionStore.ts
M	backend/src/changes.txt
M	doc/release_notes.txt
 5 files changed, 15 insertions(+), 8 deletions(-)

-- 2026-11-24 | commit: 14b4916 | mir0n.the.programmer | v2.0.3 -- OAuth only: the e2e suite tests one kind of sign-in --
M	doc/release_notes.txt
M	e2e-test/cycle-oci.bat
M	e2e-test/cycle/cycle.spec.ts
M	e2e-test/e2e-k8s.bat
M	e2e-test/e2e-oci.bat
M	e2e-test/e2e-test.scope.md
M	e2e-test/tests/15-system-entity-protection.spec.ts
M	e2e-test/tests/18-details-esc-focus.spec.ts
M	e2e-test/tests/19-access-profile-sync.spec.ts
A	e2e-test/tests/20-direct-client.spec.ts
D	e2e-test/tests/20-token-relay.spec.ts
M	e2e-test/tests/21-credential-state-sync.spec.ts
M	e2e-test/tests/22-role-state-login.spec.ts
A	e2e-test/tests/24-oauth-token.spec.ts
D	e2e-test/tests/24-pure-oauth-token.spec.ts
R093	e2e-test/tests/25-pure-oauth-eviction.spec.ts	e2e-test/tests/25-oauth-eviction.spec.ts
A	e2e-test/tests/26-user-kinds.spec.ts
 17 files changed, 464 insertions(+), 630 deletions(-)

-- 2026-11-23 | commit: ea2255f | mir0n.the.programmer | v2.0.3 -- pure OAuth only --
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
M	e2e-test/package.json
M	e2e-test/tests/20-token-relay.spec.ts
M	e2e-test/tests/22-role-state-login.spec.ts
M	e2e-test/tests/24-pure-oauth-token.spec.ts
 6 files changed, 28 insertions(+), 4 deletions(-)
```

---

## Files Modified

```
M	README.md
M	backend/README.md
M	backend/package-lock.json
M	backend/package.json
M	backend/src/auth/routes.ts
M	backend/src/auth/sessionStore.ts
M	backend/src/changes.txt
M	doc/release_notes.txt
M	e2e-test/cycle-oci.bat
M	e2e-test/cycle/cycle.spec.ts
M	e2e-test/e2e-k8s.bat
M	e2e-test/e2e-oci.bat
M	e2e-test/e2e-test.scope.md
M	e2e-test/package.json
M	e2e-test/tests/15-system-entity-protection.spec.ts
M	e2e-test/tests/18-details-esc-focus.spec.ts
M	e2e-test/tests/19-access-profile-sync.spec.ts
A	e2e-test/tests/20-direct-client.spec.ts
D	e2e-test/tests/20-token-relay.spec.ts
M	e2e-test/tests/21-credential-state-sync.spec.ts
M	e2e-test/tests/22-role-state-login.spec.ts
A	e2e-test/tests/24-oauth-token.spec.ts
D	e2e-test/tests/24-pure-oauth-token.spec.ts
R093	e2e-test/tests/25-pure-oauth-eviction.spec.ts	e2e-test/tests/25-oauth-eviction.spec.ts
A	e2e-test/tests/26-user-kinds.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/img/ComponentModel.Compact.png
M	frontend/public/img/ComponentModel.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/why-it-matters.html
M	frontend/src/index.html
 32 files changed, 533 insertions(+), 657 deletions(-)
```

---

*From `v2.0.2` till `HEAD`*
