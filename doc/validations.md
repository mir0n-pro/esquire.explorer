# Esquire Explorer — Validation System

## Overview

Validation is layered: **HTML-level constraints** (maxlength, readonly) → **client-side `validateFields()`** (required, regex, min/max) → **save to server** → **RFC 7807 error response** → **field focus**.

---

## 1. `EsqEntityField` Validation Metadata

`src/esquire.ui/api/EsqEntityDictionary.ts`

| Field        | Type   | Purpose                                                    |
|--------------|--------|------------------------------------------------------------|
| `nullable`   | string | `'Y'` = optional, `'N'` = required                        |
| `validation` | string | Regex pattern for string format check                      |
| `minmax`     | string | `"min,max"` for number range; maxlength for string/text    |
| `readwrite`  | number | `0`=hidden, `1`=readonly, `3`=editable (only `3` validated) |
| `personal`   | string | `'Y'` allows self-edit override (see permissions.md §6)   |

---

## 2. Client-Side Validation — `validateFields()`

`src/esquire.ui/components/EsqUtils.ts`

```
validateFields(details, dictionary) → EsqValidationError | null
```

**Scope:** Only fields with `readwrite === 3` are validated. Hidden (`0`) and readonly (`1`) fields are skipped entirely.

**Debug bypass:** If `EsqUtils.DEBUG_SKIP_VALIDATION === true`, the method returns `null` immediately.

### Rule 1 — Required

```
if field.nullable !== 'Y' AND (value == null OR value === ''):
    error: "{field.label} is required"
```

### Rule 2 — String format (regex)

```
if field.type === 'string' AND field.validation is non-empty
    AND value is non-empty:
    if NOT new RegExp(field.validation).test(value):
        error: "{field.label} has invalid format"
```

- `field.validation` is used verbatim as a `RegExp` constructor argument.
- Empty/null values pass — required check handles them separately.

### Rule 3 — Number range

```
if field.type === 'number' AND field.minmax contains ','
    AND value is non-empty AND NOT isNaN(value):
    [min, max] = field.minmax.split(',')
    if num < min OR num > max:
        error: "{field.label} must be between {min} and {max}"
```

- Comma presence in `minmax` signals a range (vs. a maxlength string).
- Runs only when the value parses as a valid number.

---

## 3. `nullable` Semantics

| Value | Required? | Label HTML  | Placeholder             |
|-------|-----------|-------------|-------------------------|
| `'N'` | Yes       | `<b>…</b>`  | —                       |
| `'Y'` | No        | `<span>…</span>` | `field.nullmeaning` as grey placeholder |

Optional fields show a clear (×) button when a value is present. Dropdowns use `[style.color]` grey/black to indicate null vs. selected.

---

## 4. `minmax` Field — Dual Purpose

`src/esquire.ui/components/EsqTabFieldComponent.html`

| Field type      | `minmax` interpretation       | Applied as                          |
|-----------------|-------------------------------|-------------------------------------|
| `number`        | `"min,max"` (e.g. `"0,100"`) | Range check in `validateFields()`   |
| `string`        | max length (e.g. `"50"`)     | `[maxlength]="field.minmax \|\| 50"` |
| `text`          | max length (e.g. `"2000"`)   | `[maxlength]="field.minmax \|\| 2000"` |
| `tabstring`     | max length                    | `[maxLength]="field.minmax \|\| 2000"` |

String/text maxlength is enforced at the HTML level — the user simply cannot type beyond the limit.

---

## 5. Number Formatting

`src/esquire.ui/components/EsqUtils.ts`

Format string characters: `#` = optional digit, `0` = required digit, `,` = use thousand separators.

| Format string | Example output |
|---------------|---------------|
| `#,##0.##` (default) | `1,234.56` |
| `#,##0.00` | `1,234.00` |
| `0` | `1234` |
| `0.00` | `1234.00` |
| `#,##0.####` | `1,234.5678` |

Implementation uses `Number.toLocaleString('en-US', { useGrouping, minimumFractionDigits, maximumFractionDigits })`.

`onNumberInput()` in `EsqTabFieldComponent` strips commas and re-parses on every keystroke, storing the raw numeric value in `this.details[field.name]`.

---

## 6. HTML-Level Constraints

`src/esquire.ui/components/EsqTabFieldComponent.html`

- `[readonly]="fieldReadOnly(field.readwrite, field.personal)"` — prevents keyboard input
- `[disabled]="fieldReadOnly(field.readwrite, field.personal)"` — on selects
- `[attr.tabindex]="fieldReadOnly(...) ? -1 : null"` — removes readonly fields from tab order
- `[maxlength]` / `[maxLength]` — browser enforces max characters (see §4)

---

## 7. Change Detection — `getChangedFields()`

`src/esquire.ui/components/EsqUtils.ts`

```
getChangedFields(original, current) → object | null
```

- Compares each key present in `original` against `current`.
- Arrays compared via `JSON.stringify()`.
- `null` values handled explicitly (typeof null === 'object' edge case).
- Returns `null` if nothing changed, otherwise returns an object with only the changed key/value pairs.

The **Save button** in `EsqEntityDetailsDialog` is disabled (`[disabled]="!hasChanges()"`) until at least one field differs from the original snapshot loaded from the server.

`hasChanges()` also recurses into sub-entity fields (`field.type === 'subentity'`).

---

## 8. Save Flow

`src/esquire.ui/components/EsqEntityDetailsDialog.ts`

```
onSave()
  │
  ├─ EsqUtils.validateFields(details, dictionary)
  │      returns EsqValidationError | null
  │
  ├─ [client error] → alert(error.message) → focusField(error)  STOP
  │
  ├─ EsqUtils.getChangedFields(original, details)
  │      returns changed fields only
  │
  └─ restApi.esquireCmdSave(...)
         │
         ├─ [success] → reload details snapshot, restore tab
         │
         └─ [HTTP error] → rfc9457Interceptor parses RFC 7807 body
                │
                ├─ alert('Save failed: ' + err.detail || valError.message)
                └─ focusField(valError)
```

### Unsaved-changes guard

`onClose()` checks `hasChanges()`. If true, prompts:
> *"You have unsaved changes. Press OK to save, or Cancel to discard."*

---

## 9. Server Error — RFC 7807 / ProblemDetail

`src/app/interceptor/rfc9457Interceptor.ts` + `src/esquire.ui/api/ProblemDetail.ts`

The HTTP interceptor catches all non-2xx responses and constructs a `ProblemDetail` object:

```
{
  type:          string   // URI identifying error type
  title:         string   // Short human-readable summary
  status:        number   // HTTP status code
  detail:        string   // Actionable explanation
  instance?:     string   // URI of specific occurrence
  traceId?:      string   // Cross-system trace ID
  timestamp?:    string
  requestId?:    string
  correlationId: string   // from Esq-Correlation-ID response header
  processingTime?:string
  stackTrace?:   string
  errors?:       EsqValidationError[]
}
```

Headers extracted by the interceptor:
- `X-Request-ID` → `requestId`
- `Esq-Correlation-ID` → `correlationId`

---

## 10. `EsqValidationError` Structure

`src/esquire.ui/components/EsqValidationError.ts`

```typescript
{
    fieldName:  string   // matches data-field attribute in DOM
    fieldLabel: string   // human-readable label for alert
    message:    string   // full error message
    tabIndex:   number   // tab panel index for navigation
}
```

Created client-side in `validateFields()`. Parsed server-side from `err.errors[0]` in `catchError`:
- `tabIndex` parsed with `parseInt(apiErr.tabIndex, 10) || 0` (arrives as string from backend).

---

## 11. Field Focusing — `focusField()`

`src/esquire.ui/components/EsqEntityDetailsDialog.ts`

```typescript
focusField(error: EsqValidationError): void {
    if (this.tabGroup) {
        this.tabGroup.selectedIndex = error.tabIndex;   // switch to correct tab
    }
    setTimeout(() => {
        var el = document.querySelector('[data-field="' + error.fieldName + '"]');
        if (el) el.focus();
    }, 100);
}
```

- The `setTimeout` defers DOM query until after Angular re-renders the newly selected tab.
- `data-field` attributes are set on every input/select via `[attr.data-field]="field.name"` in `EsqTabFieldComponent.html`.

---

## 12. Error Display in Explorer

`src/explorer/flatTree/app-explorer.component.ts`

When a top-level REST error occurs (not a field-level save error), the app opens a read-only
`ProblemDetail` dialog. The `errors[]` array is serialized to a formatted JSON string for display
in a `tabstring` field:

```typescript
errors: this.errorReport.errors
    ? JSON.stringify(this.errorReport.errors, null, 2)
    : undefined
```

---

## 13. Debug Flags

`src/esquire.ui/components/EsqUtils.ts`

| Flag                            | Effect                                        |
|---------------------------------|-----------------------------------------------|
| `EsqUtils.DEBUG_SKIP_VALIDATION`| `validateFields()` returns `null` immediately |
| `EsqUtils.DEBUG_SKIP_PERMISSION`| `isCommandAllowed()` always returns `true`    |
| `EsqUtils.DEBUG`                | Enable verbose console logging                |
| `EsqUtils.DELAY`                | Add artificial delay to API calls             |

---

## 14. List Field Types — `tab-ikn-list` and `tablist`

### `tab-ikn-list` — `EsqTabIknListComponent`
`src/esquire.ui/components/EsqTabIknListComponent.ts`

An editable list of entities identified by `{id, name, kind}`. The component enforces its own
**content rules** via `canAddMenuItem()` before an item is allowed into the list:

| Rule | Logic | Location |
|------|-------|----------|
| No duplicate by name | `tabIknElements[i].name == item.name` → reject | `canAddMenuItem()` line 242 |
| Kind-exclusive (admin role, kind=980) | at most one item with `kind === 980` | `canAddMenuItem()` line 247 |

These checks run at the moment the user selects an item from the Add menu — invalid items are simply
not offered (menu item is hidden, not shown as disabled).

**Data flow for validation integration:**

- `details[field.name]` holds the current list array.
- On every add/remove the component emits `esqListElementsChange` → parent writes back to `details[field.name]`.
- `getChangedFields()` in `EsqEntityDetailsDialog` detects the array change via `JSON.stringify` comparison
  and enables the Save button.
- `validateFields()` in `EsqUtils` currently has **no rule** for `tab-ikn-list` — required/count
  checks for list fields are not performed client-side. Server validation applies.

**`readonly` input:**

When `readonly === true`, `esqEnableAdd` and `esqEnableRemove` are not set in `ngOnInit()`, so
neither the Add nor the Remove button is activated regardless of `esqAddMenuElements`.

**Self-refresh guard (`lastEmitted`):**

`ngOnChanges` rebuilds the list when `esqListElements` changes from outside. It skips the rebuild
when the change was self-emitted (add/remove) to avoid a double-render cycle. The sentinel is
cleared after each external change.

---

### `tablist` — `EsqTabListComponent`
`src/esquire.ui/components/EsqTabListComponent.ts`

A **read-only** list of string values with a single entity kind. No Add/Remove logic is active
(button methods are stubs). No content validation is performed. Used for display-only relationship
lists where the server controls membership.

---

### Template wiring in `EsqTabFieldComponent`

```html
<!-- tab-ikn-list -->
<esq-tab-ikn-list
    [esqListElements]="details[field.name]"
    (esqListElementsChange)="details[field.name] = $event"
    [esqAddMenuElements]="details[field.name + 'All']"   <!-- available items pool -->
    [readonly]="fieldReadOnly(field.readwrite, field.personal)"
    [esqEnableDetails]="enableDetails"
/>

<!-- tablist -->
<esq-tab-list
    [esqListElements]="details[field.name]"
    [esqListNodeType]="nodeTypeFromFormat(field.format)"
/>
```

The available-items pool is loaded into `details[field.name + 'All']` by the server alongside the
current list. `canAddMenuItem()` filters out items already present in the current list from that
pool before they reach the menu.

---

## 15. Key File Index

| File | Purpose |
|------|---------|
| `src/esquire.ui/components/EsqUtils.ts` | `validateFields()`, `getChangedFields()`, `formatNumber()` |
| `src/esquire.ui/api/EsqEntityDictionary.ts` | Field metadata: `nullable`, `validation`, `minmax` |
| `src/esquire.ui/components/EsqTabFieldComponent.ts` | `fieldReadOnly()`, `onNumberInput()`, `parseNumber()` |
| `src/esquire.ui/components/EsqTabFieldComponent.html` | HTML constraints: `maxlength`, `readonly`, `disabled`, `data-field` |
| `src/esquire.ui/components/EsqEntityDetailsDialog.ts` | `onSave()`, `hasChanges()`, `focusField()`, server error handling |
| `src/esquire.ui/components/EsqNodeDetailsDialog.ts` | Same `fieldReadOnly()` for tree-node dialog |
| `src/esquire.ui/api/ProblemDetail.ts` | RFC 7807 response shape and dictionary for error dialog |
| `src/app/interceptor/rfc9457Interceptor.ts` | HTTP interceptor — parses RFC 7807 body and headers |
