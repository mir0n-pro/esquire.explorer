# Esquire Haubergeon

Gatling 3.13 (Java DSL) test harness for the Esquire stack. Drives HTTP
load against a running deployment from outside and produces per-request
timing with multi-tier attribution (client / gateway / service / DB).

> **Full reference:** [`services/doc/Esquire.Haubergeon.md`](../../services/doc/Esquire.Haubergeon.md)
> -- command catalog, identity model, configuration knobs, performance
> matrix format, common workflows, architecture pointers.
>
> This README is the on-module overview. The reference doc above is the
> place to look for the depth.

## Build

```
mvn -pl hauberk install            (from services/, or `mvn install` from hauberk/)
```

Output: `target/hauberk.jar` -- one fat jar with Gatling, picocli, all
deps. Rebuild whenever a Simulation, Chain, or `HauberkConfig` field
changes.

## Run

```
hauberk.cmd <subcommand> [options]
```

`hauberk.cmd` is the launcher; one line of `.cmd` that prepends the JVM
`--add-opens` flags Gatling 3.13 requires.

### Subcommands

| Subcommand | What it does |
|---|---|
| `list` | List discovered Simulation classes |
| `run <sim> [opts]` | Launch a Gatling simulation |
| `summary <csv>` | Print per-URL summary for a saved metrics CSV |
| `diff <csv-a> <csv-b>` | Side-by-side per-URL comparison with deltas |
| `help [command]` | picocli help |

### Quick start

```
hauberk.cmd list                                          (catalog)
hauberk.cmd run entity-smoke --metrics                    (JWT smoke + perf matrix)
hauberk.cmd run entity-smoke --metrics --S                (same smoke, JWS+ Introspection variant)
hauberk.cmd summary output/EntitySmoke-.../entity-smoke.csv   (per-URL summary)
hauberk.cmd diff   output/<run-a>/<scn>.csv output/<run-b>/<scn>.csv  (A vs B)
```

## Two certified clients

| KC client | Mode | Backed by USR | esq_rootpath |
|---|---|---|---|
| `esq-hauberk` | JWT (default) | Test Driver, uid=15 | `1.14.` |
| `esq-hauberk-S` | JWS+ Introspection (`--S` flag) | Test Driver S, uid=16 | `1.14.` |

Both scoped to **Test House** (org pk=14, seeded in `db.seed`). The
hauberk can only create/read/modify entities inside the Test House
subtree.

## Files in this module

```
explorer/hauberk/
├── src/main/java/.../hauberk/
│   ├── auth/         -- KcTokenClient, RefreshableToken
│   ├── chain/        -- ChainBuilder atoms (CreateUser, Deposit, ...)
│   ├── cli/          -- HauberkCli + picocli subcommands
│   ├── config/       -- HauberkConfig, EntityKinds
│   ├── health/       -- HealthPreCheck
│   ├── perf/         -- PerformanceMatrix
│   └── simulations/  -- 16 Gatling Simulations
├── hauberk.properties     -- canonical config
├── hauberk-S.properties   -- overlay for esq-hauberk-S (JWS+ variant)
├── hauberk.cmd            -- launcher (java + --add-opens + -jar)
├── pom.xml               -- maven + maven-shade-plugin (fat jar)
└── target/hauberk.jar     -- built artifact
```

## Cross-references

- [`services/doc/Esquire.Haubergeon.md`](../../services/doc/Esquire.Haubergeon.md)
  -- full reference doc.
- [`services/doc/Esquire.ObservabilityStack.md`](../../services/doc/Esquire.ObservabilityStack.md)
  -- the four-layer measurement protocol (`X-Response-Time` /
  `Esq-Gw-Inner-Time` / `Esq-Srv-Outer-Time` / `Esq-Srv-Inner-Time`)
  the matrix consumes.
- [`services/doc/keyCloak-gateway.JWE.md`](../../services/doc/keyCloak-gateway.JWE.md)
  "v1.2.4 closing" section -- the three certified auth patterns
  (BFF / JWT / JWS+). The hauberk exercises JWT and JWS+.
- [`services/doc/Testing.md`](../../services/doc/Testing.md) -- Gatling
  as Esquire's standard testing framework.
