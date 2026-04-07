# Kind: Context and Normalization Rules

## Two Contexts for Kind

### nodeKind — tree perspective

`nodeKind` is used when talking about a **tree node** — an element in the tree that may be either
an entity itself or a reference (link) to an entity. A tree node has its own kind that can be
**odd** (link variant) or **even** (base entity).

Examples:
- `caccount` → id 50 (even, base entity)
- `caccountlnk` → id 51 (odd, link/reference to an account entity)

`nodeKind` is always the **normalized (even)** kind of the entity behind the node, regardless
of whether the node itself is a link variant. It is set once at the entry point of the node
command path and carried in `EsqNodeCommandContext.nodeKind`.

Use `nodeKind` when:
- Working in the `call()` / `executeWithNode()` path
- Referring to the entity kind of a tree node for REST API calls
- Storing normalized kind in `EsqNodeCommandContext`

Never use `node.kind.id` for REST calls — it may be odd. Except tree commands

### entityKind — entity perspective

`entityKind` is used when talking about the **entity itself**, independently of how it appears
in the tree. It is always **normalized (even)**.

Use `entityKind` when:
- Working in the `calle()` / `executeWithEntity()` path
- Referring to an entity kind in API interfaces, method parameters, dialog data
- Storing normalized kind in `EsqEntityCommandContext`
- Dictionary API: `EsqDictionaryApi.dictionary(entityKind)`

### node.kind — display only

`node.kind` is the `EsqObjectKind` object on a tree node. Its `.id` may be **odd** (link variant).
Use `node.kind` and `node.kind.id` only for **display purposes** (icon, name, flags).
Never pass `node.kind.id` to a REST API call directly.
Well except tree calls;

---

## Normalization

Odd kind ids (link variants) must be normalized to even before any REST API call.
Normalization: `EsqObjectKindFactory.normalize(kind)` → `Math.floor(kind / 2) * 2`

**Do not inline the formula.** Always call `EsqObjectKindFactory.normalize()`.

### Where normalization happens — one place per entry path

| Entry point | Method | Normalizes |
|---|---|---|
| `call()` node path | `doNodeCommand()` | `node.kind.id` → `context.nodeKind` |
| `calle()` entity path | `doEntityCommand()` | `entityKind` param → `context.entityKind` |
| `create()` path | `doCreate()` | `typeId ?? node.kind.id` → local `kind` |

Downstream code (handlers, dialogs) must **not** normalize again — use the already-normalized
value from context.

---

## Naming Rules Summary

| Name | Type | Meaning | Normalized |
|---|---|---|---|
| `node.kind` | `EsqObjectKind` | Kind object of a tree node (display) | no — may be odd |
| `node.kind.id` | `number` | Raw kind id of a tree node | no — may be odd |
| `nodeKind` | `number` | Normalized entity kind, node path | yes — always even |
| `entityKind` | `number` | Normalized entity kind, entity path | yes — always even |

Use bare `kind` only when **outside of entity/node command context** — i.e. in utility methods,
normalization helpers, and REST API interface signatures where there is no ambiguity:

- `EsqObjectKindFactory.normalize(kind: number)` — utility, no context
- `EsqRestApi.esquireCmdDel(kind: number, ...)` — REST interface contract
- `EsqDictionaryApi.dictionary(entityKind: number)` — entity context, so `entityKind`
- Private helpers with no specific dialog context (called from both paths equally): `doDelete(node, kind, ...)` — bare `kind`
- Private helpers specific to a node dialog: `runDetailsAsync(cmd, node, nodeKind, ...)`, `openMoveDialog(node, nodeKind, ...)` — use `nodeKind`
- Private helpers specific to the entity path: `runEntityDetailsAsync(id, entityKind, ...)` — use `entityKind`

Do **not** use bare `kind` inside `executeWithNode` / `executeWithEntity` implementations —
use `context.nodeKind` or `context.entityKind` explicitly to make the context clear.
