<table style="width: 100%; table-layout: fixed;">
  <tr>
    <td style="width: 12%"><img src="../favicon.ico" alt="Esquire logo" align="right" valign="middle" width="64"></td>
    <td style="width: 88%;">
       <h1>Esquire Application Frameworks(tm) 2.0</h1>
    </td>
  </tr>
</table>

# e2e Test Scope -- Esquire Explorer

## Prerequisites
- Database seeded with `db.seed` dataset (tests rely on the seeded Test House office and
  the mainadmin login; read-only navigation specs also rely on the known seed structure)
- Full backend stack running: `cd C:\MyProjects\esquire\services2\compose && docker compose up`
- Frontend dev server running: `explorer\frontend\run-git.bat` (or `run-yalc.bat` for local lib)
- Credentials in `e2e-test\.env` (default: mainadmin / q)

> Tests MUST run against the db.seed dataset. Results are undefined against an empty or
> differently-populated database.

## Self-contained working data (Test House)

The mutating specs (entity lifecycle, accounting) do NOT touch the shared seed tree. Each
builds its OWN working subtree under the seeded Test House office (org 14, ep_path `1.14.`)
via the authenticated `/api` proxy in `beforeAll`, and removes it in `afterAll`. Accounts
created under Test House purge their transaction history on delete (the pacMan Test-House
path gate forces close + transaction purge), so teardown needs no explicit close/withdraw.
Helper: `helpers/testHouse.ts` (`setupHouse` / `createOffice` / `teardownHouse`).

## How to run

```
explorer\e2e-test.bat              # headless, all tests
cd e2e-test && npm run test:ui     # Playwright UI mode (interactive)
```

HTML report is generated at `e2e-test\html-report\latest\index.html` after each run.

## Configuration

- `workers: 1`, `fullyParallel: false` -- all tests run strictly sequentially.
- `timeout: 60s`, `retries: 2` -- tolerate cold-start / dev-server latency right after a stack
  (re)deploy (the first KC redirect, app load, or entity write can spike). A latency flake retries
  and is reported *flaky*, not *failed*; steady-state tests finish in 1-2s. Login-path waits in the
  helpers/specs use a 30s budget for the same reason.
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
After login: profile icon -> "Access Profile" opens dialog with tabbed profile fields; close
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

### 08-new-entity.spec.ts -- entity lifecycle (describe.serial, shared session)
Single login shared across three sequential tests -- no re-authentication between steps.
`beforeAll` builds two offices under Test House (source + destination); `afterAll` removes both.
- **creates entity under the source office**: navigate Test House -> source office -> New ->
  kind "org" -> fill "e2e-test-entity" -> Create -> close result dialog -> entity visible in tree.
- **moves entity to the destination office**: right-click entity -> Move -> expand Test House in
  the dialog tree -> select the destination office -> Select -> confirm Yes -> both dialogs close.
- **deletes entity**: right-click entity (now under the destination office) -> Delete -> confirm
  Yes -> entity removed from tree.

### 11-deposit.spec.ts -- accounting lifecycle (describe.serial, shared session)
Single login. `beforeAll` builds an office under Test House with a merchant user + EUR account
(the source) and a client user + USD account (the destination), then navigates to the EUR
account; `afterAll` tears the subtree down. Net effect on balances is zero across all five tests.
- **deposit dialog opens and submits**: Accounting -> Deposit -> amount 100, ref ABC-123 -> Submit -> confirm Yes -> close.
- **withdrawal dialog shows negative amount and completes**: Accounting -> Withdrawal -> amount 100, ref ABC-456 -> Submit -> confirm Yes -> close. Restores balance to 0.
- **deposits 100 EUR into the EUR account for transfer**: Accounting -> Deposit -> amount 100, ref ABC-T01 -> Submit -> confirm Yes -> close. Funds the source account for transfer.
- **transfers 100 EUR to the USD account at rate 1.18**: Accounting -> Transfer -> verifies rate field is readonly with EUR/EUR label (same-ccy initial state) -> changes dest picker to the client USD account (Test House / office / All clients / client) -> verifies rate label updates to "Rate EUR/USD" and field becomes editable -> fills amount 100, rate 1.18 -> Submit -> confirm Yes -> close.
  Select dialog: descends by explicit `[aria-level]` (Test House=2, office=3, All clients=4, client=5, account=6) with click + ArrowRight per level (dblclick causes an expand/collapse race on the toggle icon), disambiguating the virtual folders that repeat across depths.
- **withdraws 118 USD from the USD account**: selects the office tree node, descends the list pane (All clients -> client), selects the USD account; Accounting -> Withdrawal -> amount 118, ref ABC-T02 -> Submit -> confirm Yes -> close. Restores both accounts to 0.

Main-tree navigation for the mutating specs descends the **list pane** for the folder/user
levels (the list shows only the active node's direct children), avoiding the tree's
cross-depth name collisions on the virtual folders ("All merchants" / "All clients").

### 13-transfer.spec.ts
Stub -- see 11-deposit.spec.ts.

### 14-error-handling.spec.ts
Provoke a backend error; bottom status bar shows error message; error report icon opens
dialog with RFC 7807 Problem Detail fields (title, detail, status).

### 15-system-entity-protection.spec.ts -- system entity protection (anti-deletion)
After login, calls the BFF `/api/esq-cmd-del` with the authenticated browser session (session ->
BFF injects bearer -> gateway -> enyMan -> DB guard) and asserts each protected entity refuses the
delete, with the status each protection actually answers. Two protections, told apart:
**403** for the system root (org 1, kind 0) -- the permission matrix has no delete on kind 0 for
any role; **409** for the Test House office (org 14) and the Test Driver user (15) -- the
system-entity flag. Each target carries the kind its ROW has, since the server compares the two
and a target named under a kind it does not hold answers 404 and proves nothing. Read-only -- no
entity is removed.

### 16-session-expiry.spec.ts -- session-expiry recovery
- **the auth=expired marker shows the notice and strips the marker from the URL**: loading
  `/?auth=expired` shows the "Your session expired -- please log in again" landing notice, and
  ngOnInit strips the marker so a reload does not keep showing it.
- **a plain landing shows no session-expired notice**: a normal `/` load shows no notice.
- **the session-expired notice does not push the login button out of the toolbar**: with the notice
  shown (`/?auth=expired`), the standalone login button stays within the toolbar's single-row band
  (bounding-box check, since `toBeVisible` alone does not catch an element clipped into a 2nd grid row).
- **a dead session on an API action bounces to the landing notice**: after login, `/api/*` is
  forced to 401 {no session} and `/auth/me` to unauthenticated; a tree Refresh fires an `/api/*`
  call -> the rfc9457Interceptor redirects to `/?auth=expired` -> the landing notice appears.

### 17-login-cancel.spec.ts -- Keycloak login Cancel link
- **login page shows a Cancel link that returns to the app**: from the app, Log in -> the KC
  esquire-explorer login page shows a Cancel link (target = the app origin taken from the flow's
  redirect_uri); clicking it returns to the app landing, unauthenticated.
- **Cancel link persists across a failed-login re-render**: wrong credentials re-render the KC
  login page (the URL drops redirect_uri); the Cancel target survives via sessionStorage and still
  returns to the app.

### 18-details-esc-focus.spec.ts -- Details dialog Esc/focus
- **a single Esc closes the Details dialog on an editable entity**: navigate Test House -> All
  admin-s -> select the seeded admin **Test Driver** -> open Details; focus lands inside the dialog
  on open (on its Close button) and a single Esc closes it. Guards the fix for the editable-dialog
  focus bug where Esc was ignored (focus stayed on the launching toolbar button) until a Tab moved
  focus into the dialog.

### 19-access-profile-sync.spec.ts -- access-profile save -> Keycloak identity sync
- **connect -> update role -> disconnect round-trips the identity through Keycloak**: builds its own
  subtree under Test House, then on the merchant user: saves the access profile with connect=Y (Keycloak
  CREATES the identity), grants a role it does not already hold (Keycloak UPDATES the identity; the roles
  stay in Esquire, and the save evicts the user's cached claims at the gateway), and saves connect=N
  (Keycloak REMOVES the identity). Tears the subtree down.
- THE GAP THIS FILLS: spec 03 only OPENS and CLOSES the Access Profile dialog -- it never saves. So the main
  suite never once drove the identity path, and NOTHING anywhere drove a ROLE change.
- THE ORDER IS THE CONTRACT, not cosmetics. keySmith derives the Keycloak operation from the connect flag:
  N->Y is a CREATE, Y->Y an UPDATE, Y->N a DELETE. So the role change must sit BETWEEN connect and
  disconnect: it is the only thing that drives kcMaster's UPDATE branch, and kcMaster looks the user up in
  Keycloak by username and throws if the identity is not there yet. Before this spec existed the update path
  was driven by NOTHING (esq.biz.kc.sync.total only ever showed CREATE and DELETE).
- Exercises the full chain for real: browser session -> BFF /api proxy (injects the bearer) -> gateway ->
  keySmith (saves the profile, publishes a URQ on the kc R&R bus) -> kcMaster (calls the Keycloak admin API).

### 20-direct-client.spec.ts -- a direct client: its own token, straight to the gateway
- **a direct client is a service that calls the gateway itself, with no BFF in between.** `esq-hauberk`, the
  load harness, is that client. It takes its own token from KeyCloak (client_credentials) and sends it as a
  Bearer.
- **the token carries the login only**: `azp` and `preferred_username`, with no Esquire claim and no realm
  roles.
- **the client reads its own access profile**: the gateway takes the claims from keySmith by the login id,
  and `/esq-key` answers with the seeded profile 15 (`esq-hauberk@mir0n.pro`).
- **the client reaches a protected read** (`/esq-dict?kind=1000`), and **forged claim headers are
  replaced**: a call that sends its own `X-Esq-UID`, `X-Esq-Root-Path` and `X-Esq-Roles` still reads the
  client's own profile.
- **no token is refused at the edge** with 401.
- Targets: the docker gateway (localhost:7070) by default; e2e-k8s.bat and e2e-oci.bat point `GATEWAY_URL` /
  `KC_URL` at the target. The client id, the secret and the login id default to the committed realm import
  and the seed (`DIRECT_CLIENT_ID`, `DIRECT_CLIENT_SECRET`, `DIRECT_CLIENT_LOGIN`).

### 21-credential-state-sync.spec.ts -- credential state reaches KeyCloak, and comes back off
- **force password change and TOTP: requested, then withdrawn**: Esquire never changes a password or
  configures TOTP itself -- it records the REQUEST (`au_force_change_flg`, `au_tfa_method`) and keySmith
  syncs it to KeyCloak as a required action, which KeyCloak puts in front of the user at the next login.
  The spec asserts both directions against KeyCloak required actions: raised, KeyCloak asks; lowered,
  KeyCloak stops asking.
- THE GAP THIS FILLS: the taking-back half had neither coverage nor implementation. `tfaMethod` g -> n --
  TOTP requested, the user never logged in to set it up, then cancelled -- removed an otp credential that
  was never created and left CONFIGURE_TOTP standing, so the database said TOTP was off while KeyCloak
  still forced the setup. Nothing in the suite could see it: nothing here had ever read a required action.

### 22-role-state-login.spec.ts -- a wrong role setting, met the way a user meets it
- **activation and roles are two steps, and nothing makes an operator do the second one.** A user can be
  given a working login and left with no role, and the sign-in then fails a long way from the cause. The
  spec drives three wrong settings and signs in as the user for each: no role at all; an admin role but no
  TREE; TREE but no admin role.
- **no role, and admin-without-TREE, must both be REFUSED with a sentence naming the account.** Asserted
  twice over: the answer on `/api/esq-key` is 403 carrying a problem detail whose `detail` holds the login
  id and "no privileges", and the message the browser actually puts in front of the user says the same.
  The account is named by its login id, because the token carries no Esquire id.
- THE REGRESSION THIS PINS: a roleless token used to be refused as `invalid_token`. The browser reads 401
  as a dead session and bounces to the login, which succeeds, which 401s again -- a loop reported as "your
  session expired", the one thing that had not happened. Every sign-in here also asserts the flow never
  visits the `auth=expired` marker.
- **TREE without an admin role is NOT an error** and is asserted as working: it signs in, the profile reads
  200, and only a change is refused (403 on a create). A read-only account is a legitimate setting.
- The KeyCloak halves (does the account exist yet, setting a password on it)
  go through the admin API, the same arrangement spec 21 uses -- `KC_ADMIN_SECRET` / `KCMASTER_ADMIN_SECRET`,
  with no fallback. Activation leaves a TEMPORARY password with UPDATE_PASSWORD standing, so the spec sets a
  permanent one and clears the required actions -- otherwise the sign-in lands on KeyCloak's change-password
  form and the spec would be asserting that form instead of the role state. The spec sets its password only
  once KeyCloak holds the temporary one, because kcMaster creates the user and sets that password in two calls.
- **a role change has nothing to wait for.** The roles stay out of KeyCloak, and the save removes the user's
  cached claims at the gateway, so the next sign-in reads the new roles.
- The teardown disconnects the user, removes the office, and then fails if KeyCloak still holds the user.

### 23-logout-switch-user.spec.ts -- logout ends the Keycloak session, not only the Esquire one
- **the next login must ask again.** Logs in, logs out through the toolbar, then starts a login and asserts
  Keycloak presents the credentials form. If it does not, the SSO cookies survived and the user cannot be
  switched -- the account just signs straight back in.
- Also asserts `/auth/logout` answers **200**, not a redirect. That is the shape distinction: RP-initiated
  logout only works as a top-level navigation, so the BFF hands the end-session URL back and the SPA
  navigates to it. Driven through fetch, Keycloak never sees the browser first-party and its cookies live on.

### 24-oauth-token.spec.ts -- the OAuth token of the BFF's client: the login only
- **the token carries the login only.** The handshake signs the e2e user in on `esq-angular`, the client the
  BFF uses. The access token holds `sub`, `preferred_username` and `azp`, with no Esquire claim and no realm
  or client roles; the ID token holds no Esquire claim either.
- **through the gateway, the token reads the user's own access profile.** The gateway gets the claims from
  keySmith, and the answer names the signed-in login id.
- **forged claim headers are replaced.** A call that sends its own `X-Esq-UID`, `X-Esq-Root-Path` and
  `X-Esq-Roles` still reads the caller's own profile: the gateway drops the inbound headers and sets them
  from its own lookup.
- The handshake drives the authorization code flow with PKCE straight against KeyCloak, and answers the
  callback inside the test, so the BFF never spends the code. The redirect URI is the origin of `BASE_URL`,
  so a default port in it (e2e-oci.bat names `:443`) does not break KeyCloak's redirect match. The spec talks
  to the gateway directly (`GATEWAY_URL`), the way spec 20 does.

### 25-oauth-eviction.spec.ts -- a claims change reaches a signed-in user at once
- **the gateway keeps a user's claims in a cache, and two events remove them:** keySmith sends one when an
  access profile is saved, and enyMan sends one when a user is moved. Each test changes the claims of a user
  who stays signed in, and asserts that the user's next calls see the change.
- **an access profile save:** TREE is taken away and the user's next reads are refused (403); TREE is given
  back and the reads open again (200).
- **a move:** the user is moved to another office. With the old root path still cached, the user's own
  profile would not be found; after the event it reads 200 under the new office.
- The polls never let the cache entry go idle, so only the event can change the answer. With the two
  events switched off, both tests fail.
- The test user is made and removed the way spec 22 does it, through the KeyCloak admin API
  (`helpers/kcAdmin.ts`).
- The teardown removes only what the setup made, so a failed setup reports its own error and nothing on
  top. It fails if KeyCloak still holds the user after the disconnect.

### 26-user-kinds.spec.ts -- every user kind signs in through the BFF
- **three kinds of user sign in the way a person does**, through the KeyCloak login page and the BFF: the
  main admin of the seed, a merchant user, and a client user. The two test users are built in a Test House
  office, connected with the TREE role, and given a password through the KeyCloak admin API.
- **each one works on the gateway's claims:** the name bar shows, `/api/esq-key` answers with the user's own
  login id, and the own tree loads.
- The teardown disconnects both users first; a connected user refuses deletion, and the office would stay.
  It fails if KeyCloak still holds either user once the office is gone.

### cycle/cycle.spec.ts -- full-lifecycle soak / activity generator (not a coverage assertion)
An activity generator, NOT an assertion spec: repeats a full GUI lifecycle N times (`CYCLES` env,
default 2) under the Test House to exercise every service and light up the metrics dashboard + Tempo
traces. Reuses the proven building blocks (`setupHouse` / `teardownHouse`, `navigateTo` / `listInto`,
the deposit/withdrawal dialog flow from spec 11). Each lap runs on a FRESH page in the logged-in
context: build a working subtree (office + merchant user + EUR account) -> navigate to it (enyMan /
bizTree reads) -> Connect the user (keySmith -> kcMaster -> Keycloak CREATE) -> grant the user a role while
connected (the same chain, Keycloak UPDATE) -> deposit -> withdraw -> Disconnect (Keycloak DELETE) -> tear
the subtree down; each GUI op is followed by a render pause (`RENDER_MS`). The role step is the ONE step
driven by API rather than GUI -- the roles control is a dynamic multi-select, and this suite generates
ACTIVITY rather than asserting; spec 19 is where the role contract is asserted. Gentle stop between
laps via the `cycle/.stop` marker (`cycle-stop.bat`) or Ctrl-C -- the in-flight lap finishes its
teardown and no new lap begins. Per-environment launchers: `cycle-test.bat` (docker), `cycle-k8s.bat`,
`cycle-oci.bat`.
