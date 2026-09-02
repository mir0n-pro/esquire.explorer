<table style="width: 100%; table-layout: fixed;">
  <tr>
    <td style="width: 12%"><img src="./favicon.ico" alt="Esquire logo" align="right" valign="middle" width="64"></td>
    <td style="width: 88%;">
       <h1>Esquire Application Frameworks(tm) 2.0</h1>
    </td>
  </tr>
</table>

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


## v1.2.14 — complete (09/01/2026)

The explorer's share of the **AWS** sprint. The server side moved to a second cloud and to that cloud's own
services; the explorer's job was to reach it there and to stop trusting a published credential.

| | |
|--------------------|-------------------------|
| `frontend/`| - the component-model drawings carry the AWS database, messaging and monitoring services;<br>- the architecture tab shows the refreshed drawings, names the AWS database and messaging services in its legend, and gains a section for the AWS monitoring tools;<br>- the why-it-matters tab counts monitoring as a fourth place the framework can be moved to another supplier, and names the AWS database services |
| `hauberk/`| - the load harness runs against the AWS deployment, over the same public address a browser uses |
| `e2e-test/`| - the browser suite runs against the AWS deployment unchanged, over its public address, with nothing tunnelled;<br>- the credential routine no longer falls back to the published sign-in secret: it stops and says which value is missing |

## v1.2.13 — complete (08/27/2026)

The explorer's share of the **compact topology and hardening** sprint: the site took a new motto and a re-drawn
banner, the load harness learned to measure the composed setup as well as the classic one, and the browser
routines grew to cover what the reading-back had found.<br>
[More Details: v1.2.13 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.13?tab=readme-ov-file)

## v1.2.12 — complete (08/11/2026)

The explorer's share of the **entity change number** sprint was a front-door one: the counter is internal and never reaches the browser, so the application was unchanged, while the comparison and audience pages gained the alternatives they are measured against and two overstated claims were walked back.<br>
[More Details: v1.2.12 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.12?tab=readme-ov-file)

## v1.2.11 — complete (07/25/2026)

The explorer's share of the **Observability** sprint: the browser tier joins the framework-wide
observability -- its own metrics, a timing on the hop out to the gateway, and its login-server calls visible
in traces -- the load harness gains an in-place cloud performance matrix, and a pair of security fixes land
at the login edge.<br>
[More Details: v1.2.11 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.11?tab=readme-ov-file)

## v1.2.10 — complete (07/04/2026)

The explorer's share of the **Resilience / Durability** sprint: the SPA and BFF can bound how long they wait on a slow request or a stuck upstream, the BFF can run as more than one copy behind a shared login-session store, and the test harnesses gain recovery tooling and steadier end-to-end runs.<br>
[More Details: v1.2.10 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.10?tab=readme-ov-file)

## v1.2.9 — complete (06/24/2026)

The explorer's share of the **hardening** sprint: the About page's six tabs lifted out of the Angular app shell into standalone static files loaded at runtime, and the landing copy reframed to name the vendor-agnostic Esquire Messaging Bus and its first three transport providers (ActiveMQ, Kafka, Redis).<br>
[More Details: v1.2.9 README](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.9?tab=readme-ov-file)

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

