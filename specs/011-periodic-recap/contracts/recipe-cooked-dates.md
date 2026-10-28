# Contract: Recipe `cookedDates` and « Cuisiné » action

**Applies to**: Domain item shape, sync, recipe detail UI, books contributor prerequisite for recap **Recettes** lines.

## Field

On `Item` where `type === "recipe"`:

| Field | Type | Sync |
|-------|------|------|
| `cookedDates` | `string[]` of `YYYY-MM-DD` | Item LWW patch; `fieldsUpdatedAt.cookedDates` |

See [data-model.md](../data-model.md) for validation rules.

## Use case: `recordRecipeCooked`

```text
Input: { itemId, cookedOn: YYYY-MM-DD }  // default today in local TZ
Output: updated Item | validation error
```

**Rules (FR-012)**:

- Explicit user action only — never append on ingredient/step edits.
- **Backdating**: user MAY pick any past calendar day (date picker or sheet) in v1.
- **Same-day dedupe**: if `cookedOn` already in array, no-op success (idempotent).
- Append new date otherwise; maintain sorted or insertion order (implementation choice; recap sorts by date).

## UI: recipe detail

- Primary action **Cuisiné** (or **Marquer comme cuisiné**).
- Default date: **today** (local).
- Secondary: **Choisir une date** → calendar / date input for backdating.
- Optional: show recent `cookedDates` list read-only on detail (not required MVP).

## Recap contributor

- For each recipe item not soft-deleted:
  - For each `cookedDates` entry where `startDate <= entry <= endDate` (period bounds):
    - Emit `RecapAchievement` with `domainId: recipe`, `occurredOn: entry`, `title: item.title`.

## Relation to 010

- `cookbookId` / page metadata does **not** imply cook events.
- 010 and 011 can ship independently; recap ignores cookbook fields.

## Testing

- Unit: dedupe, backdate, invalid date rejected, deleted recipe excluded from recap.
- E2e: mark cooked yesterday offline → appears in weekly recap under **Recettes**.

## FR mapping

| FR | Mechanism |
|----|-----------|
| FR-012 | Action + backdating + no inference |
| FR-006 | Recap lines from `cookedDates` |
