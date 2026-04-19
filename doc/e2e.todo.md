# e2e Test — Improvement TODO

Items that would make the Playwright suite more stable or less workaround-heavy.
Grouped by area; not all are blocking — current tests pass without them.

---

## HTML: add `data-testid` / stable attributes

### Toolbar buttons
Icon buttons are currently found by Material icon name text (`button:has-text("add")`,
`button:has-text("monetization_on")`). Icon names are implementation detail, not UI labels.

| Button | Current selector | Recommended attribute |
|--------|------------------|-----------------------|
| New…   | `button:has-text("add")` | `data-testid="btn-new"` |
| Accounting | `button:has-text("monetization_on")` | `data-testid="btn-acct"` |
| Details | `button[matTooltip="Details"]` | `data-testid="btn-details"` |
| Refresh | `button[matTooltip="Refresh"]` | `data-testid="btn-refresh"` |
| Up     | `button[matTooltip="Up one level "]` ← trailing space in tooltip! | fix tooltip text; add `data-testid="btn-up"` |
| Back   | `button[matTooltip="Back"]` | `data-testid="btn-back"` |
| Forward | `button[matTooltip="Forward"]` | `data-testid="btn-forward"` |
| Error Report | `button[matTooltip="Error Report"], button:has(mat-icon:text("bug_report"))` — double fallback shows uncertainty | `data-testid="btn-error-report"` |

### Tree nodes
Currently matched by display name text (`mat-tree-node:has-text("Company")`).
Name changes or localization would break tests.

- Add `[data-entity-id]` attribute to each `mat-tree-node`, e.g. `data-entity-id="2"`.
- Tests can then use `mat-tree-node[data-entity-id="2"]` for structure-level navigation
  and fall back to `:has-text()` only for user-visible assertions.

### Acct reference input
`input[type="text"]:not(.esq-number-input)` is a fragile negative selector.
- Add `name="ref"` or `data-testid="input-ref"` to the reference field in the acct dialog form.

### Dialog identification
All dialogs share `mat-dialog-container` — impossible to distinguish move dialog from
confirm dialog by element alone. Currently worked around with `toHaveCount(1/2)` polling.
- Add a `data-dialog` attribute to each dialog host, e.g.:
  `data-dialog="esq-move"`, `data-dialog="esq-confirm"`, `data-dialog="esq-acct"`.

---

## Backend: API response caching

`GET /esq` children list for an entity is cached server-side (~20 s TTL).
After creating an entity via `POST /esq-new`, a fresh GET still returns the old list
until the cache expires. The e2e lifecycle test works around this by sharing a single
browser session (entity visible immediately in the already-loaded tree) — but any
test that navigates to the parent in a fresh session will not see the new entity.

- Option A: honour `Cache-Control: no-cache` request header — bypass cache for the caller.
- Option B: invalidate the parent's cache entry on every write (`POST /esq-new`, `/esq-del`, `/esq-move`).
- Option C: expose a `?nocache=1` query parameter (test/dev only, guarded by profile flag).

---

## Application: tooltip text cleanup

`Up one level ` (app-shell.html) has a trailing space — the test selector currently
includes the space. Fix the tooltip string so it reads `"Up one level"` (no trailing space).

---

## Test helpers: `navigateTo` / `expandPath` initial tree state

Both helpers start with `root.dblclick()` which TOGGLES the root. If the tree
auto-expands the root on load (which it does), the first dblclick collapses it.
The subsequent `waitFor(Company)` then has to wait for an auto-re-expand that may or
may not happen, depending on component behaviour.

- Consider checking the expansion state before toggling:
  use `mat-tree-node[aria-expanded="true"]` to detect whether root is already open,
  and skip the first dblclick if it is.
- Or: add a `data-expanded` attribute to tree nodes that reflects the Angular tree state.
