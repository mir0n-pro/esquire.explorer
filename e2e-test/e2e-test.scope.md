# e2e Test Scope — Esquire Explorer

## Prerequisites
- Database seeded with `db.seed` dataset (tests rely on known entity structure)
- Full backend stack running: `cd C:\MyProjects\esquire\services\compose && docker compose up`
- Frontend dev server running: `explorer\frontend\run-git.bat` (or `run-yalc.bat` for local lib)
- Credentials in `e2e-test\.env` (default: mainadmin / q)

> Tests MUST run against the db.seed dataset. Results are undefined against an empty or
> differently-populated database.

## How to run

```
explorer\e2e-test.bat              # headless, all tests
cd e2e-test && npm run test:ui     # Playwright UI mode (interactive)
```

HTML report is generated at `e2e-test\playwright-report\index.html` after each run.

## Configuration

- `workers: 1`, `fullyParallel: false` — all tests run strictly sequentially.
- Lifecycle tests are **idempotent**: they clean up after themselves and leave the DB unchanged.

---

## Test groups

### 01-prelogin.spec.ts
App loads at localhost:4200; login hint row visible before authentication; profile menu shows
"Log in" when not authenticated.

### 02-login.spec.ts
Keycloak redirect on app load; full login flow (fills credentials, redirects back, user name
shown in toolbar); logout returns app to unauthenticated state.

### 03-access-profile.spec.ts
After login: profile icon → "Access Profile" opens dialog with tabbed profile fields; close
button dismisses dialog.

### 04-tree-load.spec.ts
Tree renders and loads nodes from API within timeout; double-click expands a node to show
children.

### 05-tree-navigation.spec.ts
Node selection updates path bar; Refresh reloads tree; Up button navigates to parent;
Back and Forward toolbar navigation.

### 06-context-menu.spec.ts
Right-click on tree node shows context menu with expected items (Details, Back); ESC dismisses
menu; Alt+Enter keyboard shortcut opens Details dialog; "Details" from context menu opens
dialog.

### 07-details.spec.ts
Details toolbar button opens dialog with tabbed form; ESC dismisses dialog; Close button
dismisses dialog.

### 08-new-entity.spec.ts — entity lifecycle (describe.serial, shared session)
Single login shared across three sequential tests — no re-authentication between steps.
- **creates entity under Department**: New → kind "org" → fill "e2e-test-entity" → Create →
  close result dialog → entity visible in tree.
- **moves entity to Company**: right-click entity → Move → select Company in dialog tree →
  Select → confirm Yes → both dialogs close.
- **deletes entity**: right-click entity (now under Company) → Delete → confirm Yes → entity
  removed from tree.

### 11-deposit.spec.ts — accounting lifecycle (describe.serial, shared session)
Single login, navigates to Mer Chant account once. Net effect on DB is zero across all five tests.
- **deposit dialog opens and submits**: Accounting → Deposit → amount 100, ref ABC-123 → Submit → confirm Yes → close.
- **withdrawal dialog shows negative amount and completes**: Accounting → Withdrawal → amount 100, ref ABC-456 → Submit → confirm Yes → close. Restores balance to 0.
- **deposits 100 EUR into 10011 for transfer**: Accounting → Deposit → amount 100, ref ABC-T01 → Submit → confirm Yes → close. Funds src account for transfer.
- **transfers 100 EUR from 10011 to 10012 at rate 1.18**: Accounting → Transfer → verifies rate field is readonly with EUR/EUR label (same-ccy initial state) → changes dest picker to account 10012 (USD, under Company / Department / All clients / Cli Ent) → verifies rate label updates to "Rate EUR/USD" and field becomes editable → fills amount 100, rate 1.18 → Submit → confirm Yes → close.
  Select dialog: Company pre-expanded (src account path); click + ArrowRight expands nodes (dblclick causes expand/collapse race on toggle icon); `[aria-level="4"]` targets "All clients" under Department (same name exists at Company level).
- **withdraws 118 USD from 10012**: navigates to Cli Ent via toolbar Up (×2) then list row dblclicks (Department → All clients → Cli Ent); selects account 10012; Accounting → Withdrawal → amount 118, ref ABC-T02 → Submit → confirm Yes → close. Restores both accounts to 0.

### 13-transfer.spec.ts
Stub — see 11-deposit.spec.ts.

### 14-error-handling.spec.ts
Provoke a backend error; bottom status bar shows error message; error report icon opens
dialog with RFC 7807 Problem Detail fields (title, detail, status).

### 15-system-entity-protection.spec.ts — system entity flag (anti-deletion)
After login, calls the BFF `/api/esq-cmd-del` with the authenticated browser session (session →
BFF injects bearer → gateway → enyMan → DB guard) and asserts a delete of each seed-flagged
entity is rejected with **HTTP 409**: root Esquire office (org 1), Test House office (org 14),
and Test Driver users (15, 16). Read-only — no entity is removed (the guard blocks before delete).
