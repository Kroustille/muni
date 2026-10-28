# Contract: Plant list & detail UI

**Applies to**: US1 plant capture, location tag, neutral list (FR-002, FR-003, FR-008, US6).

## List (`/plants`)

| Control | Behavior |
|---------|----------|
| Quick-add field | Single **Nom** input; save creates `plant` with `title` trimmed **1–500**, default `locationTag` **`indoor`** |
| Row tap | Navigate to detail |
| Soft delete | Swipe or overflow **Supprimer** → `deleted_at`; undo via existing `UndoDeleteProvider` pattern |

## Detail (`/plants/[id]`)

| Field | UI | Validation |
|-------|-----|------------|
| Title | Editable text | **1–500** trimmed |
| Emplacement | Segmented or select | **Intérieur** / **Extérieur** / **Les deux** → `indoor` / `outdoor` / `both` |
| Notes | Optional textarea | Max **5000** |
| **Dernier arrosage** | Read-only summary | Derived; « — » if never watered |

Primary actions live in [plant-care-events-ui.md](plant-care-events-ui.md).

## P2 list columns (US6)

When list shows **Dernier arrosage**:
- Format: short date or relative French (« hier », « 12 oct. ») — no « il y a X jours » guilt tone
- Never watered: « — » only

## Independent test

[quickstart.md](../quickstart.md) § P1 — Add plant.

## FR mapping

| FR | UI |
|----|-----|
| FR-002 | Quick-add |
| FR-003 | Location tag |
| FR-008 | Dernier arrosage on detail |
| FR-013 | No overdue UI |
