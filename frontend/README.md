# esquire.explorer/frontend -- Esquire Tree Explorer (SPA)

## Esquire Frameworks (tm) 2.0

The frameworks for organizing business entities in a tree -- any kind of
business or activity. Targeted at traditional Backoffice (sub)system
functionality: onboarding, user-profile maintenance, permissions,
authorization, accounting.

## What this subproject is

The Angular SPA that renders the **Esquire Tree Explorer** in the browser.
A two-pane, Windows-Explorer-shaped UI: an entity tree on the left, the
selected entity's details + commands on the right. Toolbar + context-menu
operations gated by the caller's access profile; dialogs, fields, kind
icons, and column layouts all driven at runtime from server configuration
(no hardcoded field definitions in the frontend).

![](doc/media/context-menu.jpg)

A typical session: log in via the BFF (`/auth/me`), the SPA hydrates the
access profile, the kind registry, and the dictionary; from there the
user walks the tree, opens entity details, runs administrative commands
(Create / Move / Delete) and accounting commands (Deposit / Withdrawal /
Transfer).

![](doc/media/access-profile.jpg)

## The actual implementation lives in `esquire.ui.lib`

This subproject is a **thin shell**. The reusable building blocks --
tree, details dialogs, kind registry, access-profile model, command
handler infrastructure, dictionary-driven field rendering -- live in a
separately-published Angular library:

> **`@mir0n-pro/esquire.ui`** -- sibling repository **`esquire.ui.lib`**.
> Consumed here as a tarball dependency
> (`https://github.com/mir0n-pro/esquire.ui.lib/raw/refs/tags/vX.Y.Z/pkg/mir0n-pro-esquire.ui-X.Y.Z.tgz`).
> See `package.json` -- the `lib:yalc` / `lib:local` / `lib:pkg` /
> `lib:git` scripts switch between local-checkout, local-tarball, and
> remote-tarball sources of the same library during development.

Components / services consumed from the library include
`EsqExplorerComponent` (the tree), `EsqEntityDetailsDialog` /
`EsqNodeDetailsDialog` (server-driven details), `EsqTabFieldComponent`
(dictionary-driven field rendering), `EsqAccessProfile` (permission
model), `EsqObjectKindFactory` (kind registry), `EsqCommandHandlerRegistry`
(pluggable command handlers), and `EsqAcctPicker`.

## What this subproject contributes

What stays in the SPA (not in the library) is the **wiring**:

- `src/explorer/flatTree/app-shell.ts` -- the host component;
  implements `EsqExplorerHost`, owns the toolbar / context-menu
  definitions (`EsquireNodeTypes`, `EsqCommandMenuItems`), profile + error
  signals, OIDC bootstrap, kind-registry init, and tree-refresh callbacks.
- `src/explorer/flatTree/acct/` -- the accounting feature: account
  picker, Deposit / Withdrawal / Transfer dialogs, `EsqAcctCommandHandler`
  registered with the library's command-handler registry.
- `src/rest/` -- typed REST client generated from the
  `explorer/openapi/` spec; thin wrappers (`esquireCmdSave / New / Del /
  Move / Acct`) routing to gateway endpoints.
- `src/app/interceptor/` -- RFC 9457 problem-detail interceptor and
  request-tracing interceptor.

## Build / run

```
npm install        # pulls @mir0n-pro/esquire.ui from the published tarball
npm start          # ng serve on localhost:4200 -- BFF-backed dev flow
npm run build      # production build into dist/
npm test           # Karma + Jasmine unit tests
```

For Docker dev: `npm run docker:start` binds to 0.0.0.0:4200 with
polling enabled.

## Auth flow

The SPA never holds an access token. Sign-in goes through the BFF
(`explorer/backend/`); the SPA calls `/auth/me` at bootstrap to discover
session state, then makes data calls through the BFF (which attaches the
Bearer to gateway requests on the SPA's behalf). See `explorer/backend/`
for the BFF side.
