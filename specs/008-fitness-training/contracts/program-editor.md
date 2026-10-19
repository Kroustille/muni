# Contract: Program editor

**User stories**: US1 (Phase A) — FR-010–FR-013.

## Entry

- Route: `/fitness/program`.
- Shown when user has no program (wizard) or from settings/home “Modifier le programme”.

## Program fields

- **Nom du programme** (required text).
- List of **sessions** (ordered cards).

## Planned session card

| Control | Behavior |
|---------|----------|
| Title | Text input |
| Weekdays | Multi-select chips Mon–Sun (French labels) |
| Exercises | Ordered list; add via catalog picker only |
| Reorder | Drag or up/down |
| Delete session | Soft delete with undo |

## Planned exercise row

- Catalog picker → shows `nameFr`.
- Optional: nombre de séries par défaut, répétitions cibles, note.
- Reorder within session.

## Constraints

- Exactly one active program (MVP): creating new program replaces or deactivates previous (product: edit-in-place preferred).
- Editing plan does not mutate past `fitness_workout_log` rows.
- All saves immediate to IndexedDB; sync background.

## Validation

- Session must have title and ≥1 weekday before save (warn inline).
- Session may have zero exercises (spec edge — allowed).
