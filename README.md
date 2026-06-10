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


## v1.2.7 — complete (06/10/2026)

Rides the backend **audit-logging** sprint and lands the explorer's share of the CI/CD establishment:
the landing page reframes the audit story, the e2e suite is made deterministic, the harness gains a
report-summary fix and a list-catalog contract, and delivery moves onto automatic build-and-test.

| | |
|--------------------|-------------------------|
| `frontend/`| - landing-page Architecture tab refreshed for the audit sprint (v1.2.7 heading; new xx-rod + Redis components; optional Audit Broadcast Bus channel; the audit principle / feature-table reframed);<br>- ComponentModel diagram refreshed;<br>- version 1.2.6 -> 1.2.7 |
| `e2e-test/`| - 11-deposit selects accounts by id (Mer Chant 10011 / Cli Ent 10012) instead of row position, removing a non-deterministic account-ordering failure — full suite **31 passed** on both Docker and local k8s |
| `hauberk/`| - PerformanceMatrix post-run summary AIOOBE fix (synchronized `printSummary`, snapshotted row count);<br>- `@SimulationInfo` descriptions trimmed under the 90-char `hauberk list` cap (`SimulationCatalogContractTest`);<br>- version 1.2.4 -> 1.2.7 |
| `backend/`| - version 1.2.6 -> 1.2.7 |
| CI/CD| - GitHub Actions CI established: every push / PR builds and tests **frontend** (Angular build + headless unit tests) and **backend** (lint + build + tests) on Node 22;<br>- both `package-lock.json` committed so the automated install is reproducible |

## v1.2.6 — complete (06/02/2026)

Tracks the backend **enyMan-redundancy / race-8c** sprint (instance-aware entity-id minting, the
async move queue, and the kcMaster path-buffer). The harness gains a KC-side verification and
cleanup layer that proves the server-side fix and tidies up after it.

| | |
|--------------------|-------------------------|
| `hauberk/`| - **race-8c** verify Simulation (`RaceMoveCreateKc`): diffs DB `ep_path` against the KC user `esq_rootpath` via the master-realm admin REST API — poll-until-stable with per-tick admin-token refresh;<br>- deterministic **single-shot** repro (`RaceMoveCreateKcSingleShot`): buffer OFF reproduces the stale path, buffer ON proves the kcMaster path-buffer fix;<br>- KC orphan cleanup (`KcCleanup` Simulation + `KcAdminAuth` / `CleanupKcOrphans` chains);<br>- `residue-cleanup` is now name-prefix driven (`-Dcleanup.prefix`) and disconnects-then-deletes via the API — purges msgloss / other-named Test House leftovers, including on prod;<br>- `MoveEntity` accepts the `/esq-move` 202 async-ack; the move-create verifier is poll-until-quiescent;<br>- now 21 Simulations / 32 reusable Chains |
| `frontend/`, `backend/`| - version 1.2.5 -> 1.2.6 |

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

