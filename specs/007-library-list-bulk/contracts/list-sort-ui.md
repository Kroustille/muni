# Contract: List sort UI

**Component**: `ListSortFilter` (`src/components/ListSortFilter.tsx`)

## Controls

1. **Field select** (`<select>`): options **Date** and **Note** (`rating`) when `allowRatingField === true`; otherwise **Date** only (shopping, recipes).
2. **Direction toggle** (single `<button>`): switches `order` between `asc` and `desc`; must expose French `aria-label` describing current order and action.

## State

- Value type: `ListSort` from `src/domain/list-sort.ts`.
- `onChange` fires on field change or direction toggle.
- Parent may persist sort via existing mechanism (URL/local state) — do not regress persistence when replacing chips.

## Accessibility

- Select has visible label (`list.sort.by`).
- Direction button: `aria-label` from i18n (not icon-only silent).

## Visual

- Remove chip rows for field and direction (FR-008); use design-system form controls consistent with 005.
