# EsqTabFieldComponent — Field Types Reference

Component: `esq-tab-field`
Source: `EsqTabFieldComponent.html / .ts`
Field metadata type: `EsqEntityField` (`api/EsqEntityDictionary.ts`)

---

## Common Field Parameters

| Parameter    | Type      | Description |
|--------------|-----------|-------------|
| `name`       | string    | Key into the `details` object (`details[field.name]`) |
| `label`      | string    | Display label shown left of the input |
| `type`       | string    | Field type — see table below |
| `readwrite`  | number    | Bitmap: `0`=hidden, `1`=readonly, `3`=editable |
| `nullable`   | `'Y'`/other | `'Y'` = field is optional; affects label weight and null option |
| `nullmeaning`| string    | Placeholder text / null-option label in dropdowns |
| `tooltip`    | string    | `title` attribute on the input element |
| `listvalues` | string[]  | `value~label` pairs for dropdown options (used by `string`) |
| `format`     | string    | Type-specific format string (see per-type notes) |
| `minmax`     | string    | Type-specific: max length for `string`/`text`; `min,max` for `number` |
| `validation` | string    | Regex pattern applied to `string` fields on Save |
| `personal`   | `'Y'`/other | `'Y'` = entity owner can edit this field regardless of dialog readOnly |
| `sort`       | number    | Display order within the tab |
| `layer`      | number    | Tab index in the dialog |

---

## Editability Rules

### `readwrite` bitmap
| Value | Behaviour |
|-------|-----------|
| `0`   | Field is **hidden** — not rendered at all |
| `1`   | Field is **readonly** — rendered but not editable |
| `3`   | Field is **editable** — rendered and editable (subject to `readOnly` and `personal`) |

### Dialog `readOnly` flag
Derived from `accessProfile.isCommandAllowed(cmd, kind)` in `EsqExplorerCallApiMill`.
When `true`, all fields with `readwrite=3` are downgraded to readonly.

### `personal` override
When `field.personal === 'Y'` **and** `details.id === userId`:
the field is editable (`readwrite=3`) even if the dialog `readOnly` is `true`.
All other fields on that entity remain readonly.

### Label weight
- `nullable === 'Y'` → `<span>` label (optional field)
- otherwise → `<b>` label (required field)

---

## Field Types

### `string`
**Two variants depending on `listvalues`:**

**A — Free text input** (no `listvalues`)
- Element: `<input type="text">`
- Grid class: `esq-grid-input`
- `minmax`: max character length (default `50`); also sets `width.ch`
- `validation`: regex checked on Save
- Nullable: wrapped in `esq-nullable-input` with `×` clear button (`esq-null-clear`)
- Readonly: bottom border only, no side/top borders

**B — Dropdown** (`listvalues` present)
- Element: `<select>`
- Grid class: `esq-simple-grid-dropdown`
- `listvalues` format: `"value~Display Label"` or `"value"` (label = value)
- Nullable: null option shown in grey using `nullmeaning`; selected value shown in grey when null
- Readonly: `appearance: none`, text fill forced black, opacity 1

---

### `text`
- Element: `<textarea cdkTextareaAutosize cdkAutosizeMinRows="1">`
- Grid class: `esq-grid-input esq-grid-input-text`
- Grows vertically with content; no resize handle
- `minmax`: max character length (default `2000`)
- `nullmeaning`: shown as placeholder
- Readonly: bottom border only, transparent background
- No separate clear button (empty textarea = null)

---

### `number`
- Element: `<input type="text" class="esq-number-input">` (formatted display)
- Grid class: `esq-grid-input`
- `format`: number format pattern — `#` optional digit, `0` required digit, `,` grouping separator
  Default: `#,##0.##`  Examples: `#,##0.00`, `0`, `#,##0.####`
- `minmax`: `"min,max"` string — validated on Save (e.g. `"0,999999"`)
- Nullable: `nullmeaning` shown as placeholder; `datalist` element provides null hint
- Value stored as number; displayed formatted; parsed back on `change`

---

### `flag`
- Element: `<select>` with fixed options Yes/No
- Grid class: `esq-simple-grid-dropdown`
- Values: `'Y'` (Yes) / `'N'` (No)
- Nullable: null option shown in grey using `nullmeaning`; value shown grey when null

---

### `date`
- Element: `<input type="date">` (native browser date picker)
- Grid class: `esq-grid-input`
- Note: Angular Material `matDatepicker` skipped — it uses an Angular button that breaks the grid structure
- Nullable: wrapped in `esq-nullable-input` with `×` clear button (`esq-date-clear`, keyboard accessible)
  Clear button visible only when value is set and field is editable
- Readonly: border removed (`border: none`), bottom border only (`border-bottom: 1px solid #ccc`)
- `tooltip` → `title` attribute

---

### `tabstring`
- Component: `<esq-tab-string>` (`EsqTabStringComponent`)
- Multi-line editable text area; two-way `[(value)]` binding
- `minmax`: max character length (default `2000`)
- Fills the tab content area

---

### `tablist`
- Component: `<esq-tab-list>` (`EsqTabListComponent`)
- Read-only list of items with icon + name
- Double-click / Details button opens entity details dialog
- `format`: `"kind=N"` — identifies the `EsqObjectKind` of list items (used for icon resolution)
- `esqExplorerCallApi` wired from parent dialog

---

### `tab-ikn-list`
- Component: `<esq-tab-ikn-list>` (`EsqTabIknListComponent`)
- Editable list: Add (dropdown menu) + Remove buttons
- **Data binding:**
  - `details[field.name]` — current list (array of `{id, name, kind}`)
  - `details[field.name + 'All']` — available items for the Add menu (`esqAddMenuElements`)
- **Add button:** opens `MatMenu` built from `esqAddMenuElements`
  - `canAddMenuItem()` excludes items already in the list
  - Admin role (kind=980) limited to one instance
- **Remove button:** removes the focused row; filters `esqListElements` by `item.id`
- **Details button:** opens entity details dialog if `kind.detailed` is true
- `readonly` input: when true, Add/Remove buttons are not enabled
- Emits `esqListElementsChange` on any modification → triggers `hasChanges()` in parent dialog
- `esqEnableDetails` passed from `enableDetails` input on `esq-tab-field`

---

### `tab-iknf-table`
- Component: `<esq-tab-iknf-table>` (`EsqTabIknfTableComponent`)
- Read-only table (icon + name + fields columns)
- No editing; display only

---

### `image`
- Element: `<img>`
- `details[field.name]` used as both `src` and `alt`
- Followed by a `<mat-divider>`
- No label shown

---

### `href`
- Element: `<a href target="_blank">`
- Grid class: `esq-simple-grid2`
- `details[field.name]` must be an array: `[0]` = URL, `[1]` = link text
- Always shown with `<b>` label; no nullable/readonly variant

---

### `subentity`
- Not rendered directly by `esq-tab-field`
- Handled in `EsqEntityDetailsDialog.html` / `EsqNodeDetailsDialog.html`
- Sub-entity fields are loaded from cache via `subdictionary(details[field.name].kind)` and rendered inline as nested `<esq-tab-field>` elements
- Sub-entity changes detected and saved independently

---

### (fallback — unknown type)
- Grid class: `esq-simple-grid2`
- Renders `details[field.name]` as plain text
- Label weight follows `nullable` rule

---

## Clear Buttons (Nullable Inputs)

Both clear buttons are `<button type="button">` (keyboard accessible via Tab, activated by Enter/Space):

| Class | Used by | Behaviour |
|-------|---------|-----------|
| `esq-null-clear` | `string` (text input) | Sets `details[field.name] = null`; visible when value is set and field editable |
| `esq-date-clear` | `date` | Sets `details[field.name] = null`; visible when value is set and field editable |

Both have `focus-visible` outline for keyboard navigation; no visual change on mouse click.

---

## Change Detection

`EsqUtils.getChangedFields(original, current)` compares field by field:

| Value type | Comparison method |
|------------|-------------------|
| `null`     | strict `!==` (explicit null check before typeof guard) |
| Primitive  | strict `!==` |
| Array      | `JSON.stringify` comparison |
| Object     | skipped (sub-entities handled separately) |

Arrays (e.g. `tab-ikn-list`) are compared by serialization, so any add or remove enables the Save button.
