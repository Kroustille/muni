# Contract: List selection and bulk actions

## Selection mode

- Toggle enters selection mode (toolbar control or explicit “Sélectionner”).
- Each row shows checkbox; selected rows visually distinct.
- `ListSelectionBar` fixed/sticky at bottom when `selectedIds.size > 0`.

## Actions by list type

| List types | Actions |
|------------|---------|
| All six list types | **Supprimer** (bulk soft delete) |
| `book` only | **Assigner à une série** |
| `movie` only | **Ajouter à une saga** (i18n Saga) |
| shopping, recipe, music_* | No series/saga action |

## Bulk delete

- Calls `deleteItem` for each selected id (or batch API in use case).
- **One** undo toast; undo calls `restoreItem` for all ids in batch.
- French message indicates count when batch size > 1.

## Bulk series (books)

- Opens sheet/dialog with `GroupCombobox` (series names from `collectLibrarySeriesNames`).
- Fields: **series name** (required), **order** (required integer).
- Confirm patches all selected books with same `seriesName` and `seriesPosition`.

## Bulk saga (movies)

- Same combobox pattern with `collectLibraryFranchiseNames`.
- Fields: **saga name** (required), **order** (required).
- New saga: generate shared `franchiseId` for all selected movies.

## Validation

- Disable confirm until name + order valid.
- Overwrite prior series/saga fields on selected items (V1).
