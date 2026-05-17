| ![Alt text](./favicon.ico) | Esquire Frameworks(tm) 2.0 |
|----------------------------|-------------------------|

Frameworks for organizing business entities in a tree, for any business or activity. The framework is targeting to cover traditional 
functionality for a Backoffice (sub)system: onboarding, user profile maintenance, permissions, authorization, and accounting.

## esquire.explorer -- the front-yard of Esquire frameworks

This repository is the **front-yard system equipment**: a collection of
independent tools and applications that sit *outside* the Esquire server
and connect to it as external callers -- each for one task or another.

Not a single product. Five subprojects sharing one home, one build chain,
and the same generated REST clients pointing at `services/`:

| Subproject     | What it is                                                  | What it's for                                                                                                                  |
|----------------|-------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `frontend/`    | Angular SPA -- the **Esquire Tree Explorer** UI             | Navigating the entity tree, managing entity state, modifying relationships, running administrative operations and procedures. |
| `backend/`     | Node.js BFF (OIDC session + token broker)                   | Shielding the SPA from access tokens, handling the OIDC handshake server-side, brokering Bearer to the gateway.               |
| `openapi-generate/`| OpenAPI spec + generator templates                      | Producing the typed REST clients the other subprojects consume.                                                                |
| `e2e-test/`    | Playwright end-to-end test suite                            | Exercising the full SPA + BFF + gateway path in a real browser.                                                                |
| `hauberk/`     | Gatling-based stress / load / soak harness (**Haubergeon**) | Driving HTTP load against a running deployment from outside; per-request timing with multi-tier attribution.                  |

Each subproject is independently built, run, and deployed; they all talk to
the same **Esquire server** (`services/`) as outside callers.


## v1.2.4 — complete (05/17/2026)


| | |
|--------------------|-------------------------|
| `backend/`| - added unit test;|
| `frontend/`|- updated landing page: component model: two public entrypoints: esquire.mir0n.pro and api.esquire.mir0n.pro;|
| `openapi-generate/`| - added 2 new commands|               |
| `hauberk/`| **Haubergeon** - new subproject: chainmail armor based on Gatling 3.13: stress / load / smoke / race-repro<br>(26 reusable Chains; 17 Simulations; PerformanceMatrix CSV + per-URL summary)|

## v1.2.2 — complete (04/20/2026)

The core UI layer is delivered as a standalone library (`@mir0n-pro/esquire.ui`) that the explorer
frontend consumes as a package dependency. The library provides the tree explorer component
(`EsqExplorerComponent`), server-driven details dialogs (`EsqEntityDetailsDialog`,
`EsqNodeDetailsDialog`), entity select/move/confirm dialogs, dictionary-driven field rendering
(`EsqTabFieldComponent` covering all field types), permission model (`EsqAccessProfile`), kind
registry (`EsqObjectKindFactory`), and pluggable command handler infrastructure
(`EsqCommandHandlerRegistry`). Field layouts, control types, and validation rules are delivered at
runtime from server configuration — no field definitions are hardcoded in the frontend.

On top of the library, the explorer frontend delivers the full entity lifecycle (Create, Move, Delete
with tree refresh and permission gating) and a complete accounting command set: Deposit, Withdrawal,
and Transfer dialogs with dictionary-driven fields, AmountEffect validation, account picker
(`EsqAcctPicker`), and dynamic cross-currency rate label. The REST API was generalized to
kind-uniform endpoints, and the `esquire.ui` source tree was removed from the frontend and replaced
by the published package. The release is covered by a 30-test Playwright e2e suite validating full
entity and accounting lifecycles.

