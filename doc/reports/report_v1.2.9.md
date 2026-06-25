# Release Report: v1.2.8 → v1.2.9

**Repo:** `esquire.explorer/develop`  
**Top commit:** `78a0be0`

---

## Release Notes

### doc/release_notes.txt


**v1.2.9-2606.2112**  v1.2.9 -- landing page tabs split into their own files  
&nbsp;: Refactoring: the About/landing page's six tabs, previously one large block of markup inside the app  
&nbsp;                 shell, are now separate static files the app loads at runtime  
&nbsp;   Components:   explorer  

---

## Code Changes

### frontend/src/changes.txt


**06/21/2026** mir0n  v1.2.9 landing-page tabs moved out of app-shell into public static assets  
**explorer\flatTree\app-shell.ts**  
&nbsp;- injects HttpClient + DomSanitizer; ngOnInit fetches the 6 landing tab files (responseType text) and  
&nbsp;   bypassSecurityTrustHtml; landing = signal of the 6 SafeHtml values (LandingTabs)  
**explorer\flatTree\app-shell.html**  
&nbsp;- each landing  body replaced with ">;  
&nbsp;   inline tab markup removed (628 -> 152 lines)  
**explorer\flatTree\app-shell.scss**  
&nbsp;- .landing-panel / .landing-tab-content (+ descendants) / .feature-table / .arch-diagram removed (moved global)  
**styles.scss**  
&nbsp;- .landing-panel / .landing-tab-content (+ descendants) added GLOBAL so [innerHTML] content is styled;  
&nbsp;   .feature-table -> .landing-feature-table, .arch-diagram -> .landing-arch-diagram (kept landing- prefixed)  
**public\landing\{vision,what-is-it,who-needs-it,why-it-matters,vs-competition,architecture}.html  (new)**  
&nbsp;- the 6 landing tab bodies as static HTML assets, served from the app root  

---

## Commits

```

-- 2026-06-25 | commit: 78a0be0 | mir0n.the.programmer | typo fix --
M	frontend/public/img/og-banner.png
M	frontend/src/index.html
 2 files changed, 1 insertion(+), 1 deletion(-)


-- 2026-06-25 | commit: d7c040b | mir0n.the.programmer | v1.2.9 - version finalization --
M	README.md
M	frontend/public/landing/why-it-matters.html
M	frontend/src/index.html
 3 files changed, 20 insertions(+), 13 deletions(-)

-- 2026-06-21 | commit: 2c712e6 | mir0n.the.programmer | v1.2.9 -- landing page tabs split into their own files --
M	doc/release_notes.txt
A	frontend/public/landing/architecture.html
A	frontend/public/landing/vision.html
A	frontend/public/landing/vs-competition.html
A	frontend/public/landing/what-is-it.html
A	frontend/public/landing/who-needs-it.html
A	frontend/public/landing/why-it-matters.html
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/styles.scss
 12 files changed, 650 insertions(+), 600 deletions(-)

-- 2026-06-20 | commit: 9f1ae2f | mir0n.the.programmer | v1.2.9 -- version bump --
M	backend/package.json
M	e2e-test/package.json
M	frontend/package.json
M	hauberk/pom.xml
 4 files changed, 4 insertions(+), 4 deletions(-)

-- 2026-06-20 | commit: 861dd51 | mir0n.the.programmer | Create report_v1.2.8.md --
A	doc/reports/report_v1.2.8.md
 1 file changed, 140 insertions(+)

```

---

## Files Modified

```
M	README.md
M	backend/package.json
M	doc/release_notes.txt
A	doc/reports/report_v1.2.8.md
M	e2e-test/package.json
M	frontend/package.json
M	frontend/public/img/og-banner.png
A	frontend/public/landing/architecture.html
A	frontend/public/landing/vision.html
A	frontend/public/landing/vs-competition.html
A	frontend/public/landing/what-is-it.html
A	frontend/public/landing/who-needs-it.html
A	frontend/public/landing/why-it-matters.html
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/index.html
M	frontend/src/styles.scss
M	hauberk/pom.xml
 20 files changed, 812 insertions(+), 615 deletions(-)
```

---

*From `v1.2.8` till `v1.2.9`*
