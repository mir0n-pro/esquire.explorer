# Release Report: v2.0.0 → HEAD

**Repo:** `esquire.explorer/develop2`  
**Top commit:** `16dc977`

---

## Release Notes

### doc/release_notes.txt


**v2.0.2-2611.2216**  v2.0.2 -- pure OAuth, a lab mode: e2e for the token with no Esquire claims  
&nbsp;: New:         e2e 24-pure-oauth-token asserts the pure client's token carries the login only, that  
&nbsp;                 it reads the same access profile through the gateway, and that forged claim headers  
&nbsp;                 are replaced  
&nbsp;: New:         e2e 25-pure-oauth-eviction asserts a role change and a move reach a signed-in user at  
&nbsp;                 once on a pure OAuth stack  
&nbsp;: Config:      e2e 22-role-state-login runs on a pure OAuth stack too (PURE_OAUTH=true)  
&nbsp;: Config:      the OKE e2e run skips 24-pure-oauth-token: OKE runs the claims mode only  
&nbsp;: Doc:         e2e-test.scope.md: 22, 24 and 25  
&nbsp;   Components:   e2e  

---

## Code Changes

---

## Commits

```

-- 2026-11-22 | commit: 16dc977 | mir0n.the.programmer | v2.0.2 -- pure OAuth, a lab mode --
M	README.md
M	doc/release_notes.txt
M	e2e-test/e2e-oci.bat
M	e2e-test/e2e-test.scope.md
A	e2e-test/helpers/kcAdmin.ts
M	e2e-test/package.json
M	e2e-test/tests/22-role-state-login.spec.ts
A	e2e-test/tests/24-pure-oauth-token.spec.ts
A	e2e-test/tests/25-pure-oauth-eviction.spec.ts
M	frontend/src/index.html
 10 files changed, 754 insertions(+), 89 deletions(-)
```

