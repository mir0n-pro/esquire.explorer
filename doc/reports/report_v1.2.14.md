# Release Report: v1.2.13 → v1.2.14

**Repo:** `esquire.explorer/develop`  
**Top commit:** `32281eb`

---

## Release Notes

### doc/release_notes.txt


**v1.2.14-2609.0200**  v1.2.14 -- Finalization  
&nbsp;: Fix:         e2e 21-credential-state-sync reads the KeyCloak admin credential (once again)  
&nbsp;   Components:   e2e,  
&nbsp;                 frontend  

**v1.2.14-2609.0119**  v1.2.14 -- the KeyCloak admin credential is required  
&nbsp;: Fix:         e2e 21-credential-state-sync stops when the KeyCloak admin credential is missin  
&nbsp;   Components:   e2e  

**v1.2.14-2609.0100**  v1.2.14 -- AWS  
&nbsp;: New:         the load harness runs against the AWS deployment  
&nbsp;   Components:   hauberk  

---

## Code Changes

### hauberk/changes.txt


**09/01/2026** mir0n  v1.2.14 -- the AWS run profile  
hauberk-aws.properties  (new)  
&nbsp;- the AWS overlay: it inherits hauberk.properties and replaces only the endpoints and the  
&nbsp;   infra-orchestration commands. One public host serves all three paths on AWS, so KC, the BFF and the  
&nbsp;   gateway differ by path rather than by hostname  

---

## Commits

```

-- 2026-09-02 | commit: 32281eb | mir0n.the.programmer | v1.2.14 -- Finalization --
M	README.md
M	doc/release_notes.txt
M	e2e-test/tests/21-credential-state-sync.spec.ts
M	frontend/public/img/ComponentModel.Compact.png
M	frontend/public/img/ComponentModel.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/why-it-matters.html
A	frontend/public/logo/MQ-cd.svg
A	frontend/public/logo/RDS-cd.svg
A	frontend/public/logo/aurora-cd.svg
A	frontend/public/logo/cw-cd.svg
A	frontend/public/logo/gateward.svg
A	frontend/public/logo/kinesis-cd.svg
A	frontend/public/logo/mesnie.svg
A	frontend/public/logo/msk-cd.svg
A	frontend/public/logo/sns-cd.svg
A	frontend/public/logo/sqs-cd.svg
A	frontend/public/logo/x-ray-cd.svg
M	frontend/src/index.html
 19 files changed, 366 insertions(+), 38 deletions(-)

-- 2026-09-01 | commit: c041cd9 | mir0n.the.programmer | v1.2.14 -- the KeyCloak admin credential is required --
M	doc/release_notes.txt
M	e2e-test/tests/21-credential-state-sync.spec.ts
 2 files changed, 24 insertions(+), 4 deletions(-)

-- 2026-09-01 | commit: 8ce3fc6 | mir0n.the.programmer | v1.2.14 -- AWS --
M	doc/release_notes.txt
M	hauberk/changes.txt
A	hauberk/hauberk-aws.properties
 3 files changed, 60 insertions(+)

-- 2026-08-28 | commit: 6e0a126 | mir0n.the.programmer | v1.2.14 -- version bump --
M	frontend/package-lock.json
M	frontend/package.json
 2 files changed, 3 insertions(+), 3 deletions(-)

-- 2026-08-28 | commit: 18689f2 | mir0n.the.programmer | Create report_v1.2.13.md --
A	doc/reports/report_v1.2.13.md
 1 file changed, 271 insertions(+)
```

---

## Files Modified

```
M	README.md
M	doc/release_notes.txt
A	doc/reports/report_v1.2.13.md
M	e2e-test/tests/21-credential-state-sync.spec.ts
M	frontend/package-lock.json
M	frontend/package.json
M	frontend/public/img/ComponentModel.Compact.png
M	frontend/public/img/ComponentModel.png
M	frontend/public/landing/architecture.html
M	frontend/public/landing/why-it-matters.html
A	frontend/public/logo/MQ-cd.svg
A	frontend/public/logo/RDS-cd.svg
A	frontend/public/logo/aurora-cd.svg
A	frontend/public/logo/cw-cd.svg
A	frontend/public/logo/gateward.svg
A	frontend/public/logo/kinesis-cd.svg
A	frontend/public/logo/mesnie.svg
A	frontend/public/logo/msk-cd.svg
A	frontend/public/logo/sns-cd.svg
A	frontend/public/logo/sqs-cd.svg
A	frontend/public/logo/x-ray-cd.svg
M	frontend/src/index.html
M	hauberk/changes.txt
A	hauberk/hauberk-aws.properties
 24 files changed, 715 insertions(+), 36 deletions(-)
```

---

*From `v1.2.13` till `v1.2.14`*
