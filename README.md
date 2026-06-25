# <img src="./favicon.ico" alt="Esquire logo" valign="middle" width="64" height="64"> Esquire Application Frameworks(tm) 2.0

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


## v1.2.9 — complete (06/24/2026)

The explorer's share of the **hardening** sprint is a landing-page restructure: the About page's six
tabs, previously one large block of markup inside the Angular app shell, are now separate static files
the app loads at runtime — and the messaging copy now names all three delivered transport providers.

| | |
|--------------------|-------------------------|
| `frontend/`| - the six landing tabs (Vision, What / Who / Why it matters, vs-competition, Architecture) lifted out of the app shell into standalone static HTML files served from the app root, loaded at runtime (app-shell markup 628 -> 152 lines);<br>- landing messaging copy reframed: the vendor-agnostic **Esquire Messaging Bus** runs today with ActiveMQ, Kafka and Redis as its first transport providers;<br>- version 1.2.8 -> 1.2.9 |
| `backend/`, `e2e-test/`, `hauberk/`| - version 1.2.8 -> 1.2.9 |

## v1.2.8 — complete (06/19/2026)

The explorer's share of the **Messaging Bus** sprint: end-to-end coverage for the system-entity
anti-deletion flag (`15-system-entity-protection` asserts a delete of a system-flagged office or user
is blocked with HTTP 409), and a landing-page reframe presenting the messaging layer as the delivered,
vendor-agnostic **Messaging Bus**.<br>
[More Details: v1.2.8 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.8?tab=readme-ov-file)

## v1.2.7 — complete (06/10/2026)

The explorer's share of the backend **audit-logging** + CI/CD sprint: the landing page reframed the audit story, the e2e suite was made deterministic (full suite **31 passed** on Docker and local k8s), the hauberk harness gained a report-summary fix and a list-catalog contract, and GitHub Actions CI build-and-test was established for frontend and backend.<br>
[More Details: v1.2.7 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.7?tab=readme-ov-file)

## v1.2.6 — complete (06/02/2026)

The explorer's share of the **enyMan-redundancy / race-8c** sprint: the hauberk harness gained a KC-side verify-and-cleanup layer — the `RaceMoveCreateKc` / single-shot repros that prove the kcMaster path-buffer fix, KC orphan cleanup, and prefix-driven residue cleanup — reaching 21 Simulations / 32 reusable Chains.<br>
[More Details: v1.2.6 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.6?tab=readme-ov-file)

## v1.2.5 — complete (05/24/2026)

bizTree **Taijitu night-watch** surface: the `/esq-sweep` force-sweep reaches the generated client,
the harness gains message-loss simulations proving the cache self-heals, and the landing page
reframes bizTree as a recoverable cache service.<br>
[More Details: v1.2.5 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.5?tab=readme-ov-file)

## v1.2.4 — complete (05/17/2026)

Introduces **Haubergeon** (`hauberk/`) — a pure-REST Gatling 3.13 stress / load / smoke / race-repro
harness — and updates the landing page to the two-public-entrypoint component model.<br>
[More Details: v1.2.4 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.4?tab=readme-ov-file)

## v1.2.3 — complete (05/08/2026)

BFF sprint: the Node.js **`backend/`** tier (OIDC session + token broker) sits between the Angular
SPA and the gateway, so the browser holds only an opaque session cookie.<br>
[More Details: v1.2.3 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.3?tab=readme-ov-file)

## v1.2.2 — complete (04/20/2026)

First complete vertical slice: the `@mir0n-pro/esquire.ui` library plus the explorer frontend deliver
the full entity lifecycle and accounting command set, validated by a 30-test Playwright e2e suite.<br>
[More Details: v1.2.2 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.2?tab=readme-ov-file)

