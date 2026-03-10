# Esquire Explorer — Permissions & Access Validation

## Overview

The permission system is layered: **authentication** (Keycloak) → **server-issued profile** (REST) → **command-level gating** (`isCommandAllowed`) → **field-level gating** (`readwrite` bitmap + `personal` flag).

---

## 1. Data Structures

### EsqRole
`src/esquire.ui/api/EsqAccessProfile.ts`

| Field      | Type   | Notes                            |
|------------|--------|----------------------------------|
| `id`       | number | Role ID                          |
| `name`     | string | Display name                     |
| `adminFlg` | string | `'Y'` = admin role, `'N'` = regular |

### EsqPermission
`src/esquire.ui/api/EsqAccessProfile.ts`

| Field   | Type     | Notes                                                        |
|---------|----------|--------------------------------------------------------------|
| `id`    | string   | Permission entry ID                                          |
| `kind`  | number   | Entity type (even numbers: 0, 2, 4, 6, 8, 10 …)             |
| `name`  | string   | Label                                                        |
| `type`  | string   | Permission category                                          |
| `flags` | string[] | Array of `'Y'`/`'N'` indexed by operation (see flag map)    |

**Flag index map:**

| Index | Command constant | Operation    |
|-------|-----------------|--------------|
| 0     | `CMD_NEW`       | Create       |
| 1     | `CMD_DEFAULT`   | View / Update |
| 1     | `CMD_MOVE`      | Move (same as update) |
| 2     | `CMD_DELETE`    | Delete       |
| 3     | `CMD_KEY`       | Security keys |
| 4     | `CMD_ACCT`      | Accounting   |

### EsqAccessProfile
`src/esquire.ui/api/EsqAccessProfile.ts`

| Field            | Type            | Notes                              |
|------------------|-----------------|------------------------------------|
| `id`             | string          | User's own entity ID               |
| `kind`           | number          | User's entity kind                 |
| `name`           | string          | Display name                       |
| `loginId`        | string          | Login name                         |
| `email`          | string          |                                    |
| `pwdChangeForced`| string          | `'Y'` if password change required  |
| `tfaMethod`      | string          | Two-factor method                  |
| `roles`          | EsqRole[]       | Assigned roles                     |
| `admin`          | EsqPermission[] | Entity-level admin permissions     |
| `tools`          | EsqPermission[] | Application/tool permissions       |

---

## 2. CMD_ Constants
`src/esquire.ui/api/EsqExplorerCallApi.ts` (namespace `EsqExplorerCallApi`)

```
CMD_DEFAULT = "details"   → flag index 1 (view / update)
CMD_NEW     = "new"       → flag index 0 (create)
CMD_MOVE    = "move"      → flag index 1 (update)
CMD_DELETE  = "delete"    → flag index 2 (delete)
CMD_KEY     = "key"       → flag index 3 (security keys)
CMD_ACCT    = "acct"      → flag index 4 (accounting)
```

---

## 3. Command-Level Check — `isCommandAllowed()`
`src/esquire.ui/api/EsqAccessProfile.ts`

```
isCommandAllowed(cmd, entity_id, kind) → boolean
```

**Logic:**

1. If `EsqUtils.DEBUG_SKIP_PERMISSION` is `true` → always returns `true` (dev bypass).
2. If `String(this.id) === String(entity_id)` → user is looking at their own entity → returns `true` (full access to self).
3. Compute `knd = Math.floor(kind / 2) * 2` (rounds to even — all entity kinds are even numbers).
4. Resolve `flagIndex` by matching `cmd` to the flag map (default to index 1 if unknown).
5. Find `perm` in `this.admin` where `perm.kind === knd`.
6. Returns `perm.flags[flagIndex] === 'Y'` if perm and flag exist; otherwise `false`.

---

## 4. Dialog `readOnly` Derivation
`src/esquire.ui/components/EsqExplorerCallApiMill.ts`

```
readOnly = !accessProfile?.isCommandAllowed(cmd, node.entityId, node.kind.id)
```

This boolean is passed into the dialog's `data` input and stored as `this.readOnly`.
Also passed is `userId = accessProfile?.id`, which is the logged-in user's own entity ID.

---

## 5. Field-Level Editability — `readwrite` Bitmap

The `readwrite` field on each dictionary field (REST model `EsqEntityField`) is a bitmask:

| Value | Meaning  |
|-------|----------|
| `0`   | Hidden — field not rendered  |
| `1`   | Readonly — displayed but not editable |
| `3`   | Editable — user may change the value  |

### `fieldReadOnly(readwrite, personal)` method
Implemented identically in both `EsqTabFieldComponent` and `EsqNodeDetailsDialog`:

```
if details["id"] === userId:
    return NOT (personal === 'Y' AND readwrite === 3)
    // personal field of own entity → editable; everything else → readonly
else:
    return this.readOnly OR readwrite < 3
    // editable only when dialog allows editing AND bitmap says editable
```

**Summary table:**

| Situation                                      | Result    |
|------------------------------------------------|-----------|
| Own entity + `personal==='Y'` + `readwrite===3` | Editable  |
| Own entity + any other combination              | Readonly  |
| Other entity + `!readOnly` + `readwrite===3`   | Editable  |
| Other entity + `readOnly`                      | Readonly  |
| Any entity + `readwrite < 3`                   | Readonly  |
| Any entity + `readwrite === 0`                 | Hidden    |

The `[readonly]` / `[disabled]` binding in `EsqTabFieldComponent.html` calls
`fieldReadOnly(field.readwrite, field.personal)` on every rendered input and select.

---

## 6. `personal` Flag — Self-Edit Override

### What it is

`personal` is a string field (`'Y'` or `''`/absent) on each `EsqEntityField` in the server-side dictionary.
It is defined in `src/esquire.ui/api/EsqEntityDictionary.ts` alongside `readwrite`.

### Purpose

It allows a logged-in user to edit **specific fields of their own entity record** even when the dialog's
`readOnly` flag would otherwise forbid all editing. This is the "profile self-service" scenario: a user
can update their own name, email, or other personal data without requiring an admin-level permission.

### How it works

The condition is evaluated inside `fieldReadOnly(readwrite, personal)`:

```
if String(details["id"]) === String(userId):      // entity on screen IS the logged-in user
    ret = NOT (personal === 'Y' AND readwrite === 3)
else:
    ret = this.readOnly OR readwrite < 3
```

When the entity on screen is the current user (`details.id === userId`):
- The normal `readOnly` flag from `isCommandAllowed()` is **completely ignored**.
- Only fields explicitly marked `personal = 'Y'` **and** `readwrite = 3` become editable.
- All other fields (including `readwrite = 3` fields without `personal`) remain readonly.

### Interaction with `isCommandAllowed()`

`isCommandAllowed()` in `EsqAccessProfile` also has a personal shortcut (line 87):

```typescript
var ret: boolean = String(this.id) === String(entity_id); // "personal" mode
```

This makes the command allowed at the dialog level (so the toolbar/menu item is active), but it does **not**
open up all fields. The dialog is opened with `readOnly = false`, and then `fieldReadOnly()` applies the
`personal` flag filter at the individual-field level.

### Decision matrix for own-entity fields

| `readwrite` | `personal` | Result in dialog         |
|-------------|------------|--------------------------|
| `3`         | `'Y'`      | **Editable**             |
| `3`         | `''`/absent| Readonly                 |
| `1`         | `'Y'`      | Readonly (bitmap wins)   |
| `0`         | any        | Hidden                   |

### Where implemented

- `src/esquire.ui/components/EsqTabFieldComponent.ts` — `fieldReadOnly()` lines 88-95
- `src/esquire.ui/components/EsqNodeDetailsDialog.ts` — `fieldReadOnly()` lines 101-108
- `src/esquire.ui/api/EsqEntityDictionary.ts` — `EsqEntityField.personal` field definition (line 26)
- `src/esquire.ui/api/EsqAccessProfile.ts` — `isCommandAllowed()` personal shortcut (line 87)

---

## 7. Validation — `validateFields()`
`src/esquire.ui/components/EsqUtils.ts`

Only fields with `readwrite === 3` (editable) are validated. Hidden and readonly fields are skipped.
For each editable field, if `nullable !== 'Y'` and the value is empty/null, a `EsqValidationError` is returned with `fieldName` and message.

After a failed save, `focusField()` in the dialog uses `document.querySelector('[data-field="..."]')` to focus the offending field.

---

## 8. Full Permission Chain

```
Keycloak authentication
        │
        ▼
esquireKey() REST API call
        │  returns EsqAccessProfile (REST model)
        ▼
new EsqAccessProfile(value)   ← constructed in app-explorer.component.ts
        │  stored as Angular signal: profile = signal<EsqAccessProfile|null>()
        ▼
ExplorerComponent.esqAccessProfile()
        │  passed as @Input to EsqExplorerComponent
        ▼
Context menu / toolbar action triggers doExplorerCommand(cmd, node)
        │  calls EsqExplorerCallApiMill.doExplorerCommand(cmd, node, accessProfile)
        ▼
accessProfile.isCommandAllowed(cmd, node.entityId, node.kind.id)
        │  → readOnly = !allowed
        ▼
Dialog opened with data: { readOnly, userId }
        │
        ▼
EsqTabFieldComponent.fieldReadOnly(field.readwrite, field.personal)
        │  → [readonly] / [disabled] on each HTML input / select
        ▼
EsqUtils.validateFields()   (skips fields where readwrite < 3)
        │
        ▼
REST save API  →  server returns RFC 7807 validation errors if any
        │
        ▼
focusField(error)  →  focuses offending field in UI
```

---

## 9. Debug Flags
`src/esquire.ui/components/EsqUtils.ts`

| Flag                          | Effect                                           |
|-------------------------------|--------------------------------------------------|
| `EsqUtils.DEBUG`              | Enable verbose console logging                   |
| `EsqUtils.DELAY`              | Add artificial delay to API calls                |
| `EsqUtils.DEBUG_SKIP_VALIDATION` | Skip client-side field validation             |
| `EsqUtils.DEBUG_SKIP_PERMISSION` | `isCommandAllowed()` always returns `true`    |

---

## 10. Key File Index

| File | Purpose |
|------|---------|
| `src/esquire.ui/api/EsqAccessProfile.ts` | Core permission class: `EsqRole`, `EsqPermission`, `EsqAccessProfile`, `isCommandAllowed()` |
| `src/esquire.ui/api/EsqExplorerCallApi.ts` | `CMD_*` constants and flag-index mapping |
| `src/esquire.ui/components/EsqExplorerCallApiMill.ts` | Derives `readOnly` from permission check, opens dialogs |
| `src/esquire.ui/components/EsqTabFieldComponent.ts` | `fieldReadOnly()` — binds `readwrite` + `personal` to HTML |
| `src/esquire.ui/components/EsqNodeDetailsDialog.ts` | Same `fieldReadOnly()` for tree-node detail dialog |
| `src/esquire.ui/components/EsqEntityDetailsDialog.ts` | Generic entity dialog with save + error focus |
| `src/esquire.ui/components/EsqUtils.ts` | `validateFields()`, debug flags |
| `src/explorer/flatTree/app-explorer.component.ts` | Loads profile from REST, stores in signal, exposes to tree |
| `src/rest/model/esqEntityField.ts` | `readwrite` and `personal` field definitions (REST model) |
| `src/rest/model/esqPermission.ts` | REST permission model with `flags[]` array |
