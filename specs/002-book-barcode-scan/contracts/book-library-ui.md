# Contract: Book library UI (Phase B)

## Book detail — organization

- **Tags**: chip input; autocomplete from existing tags in library; filter list from tag chip on books list.
- **Series**: fields **Série** (name) and **Tome** (position, optional number).
- **Editions**: section **Autres éditions** when other items share `workId`; tap opens sibling detail. Action **Lier à une édition…** opens picker (search by title); **Dissocier** clears `workId` on this item only when safe (see research.md §9).

## Status & progress

- Status picker includes **À lire**, **En cours**, **Lu**, **En pause** (`paused`).
- When **En pause** or **En cours**, show optional **Pages lues** (integer ≤ `pageCount` when `pageCount` set).

## Lending

- Section **Prêt** : field **Prêté à** (text) + optional date **Depuis le**.
- Action **Marquer comme rendu** clears `loanedTo` and `loanedAt`.
- No history list in v1.

## Notes & quotes

- **Notes privées**: existing notes field (multiline).
- **Citations**: list from quote sync; **Ajouter une citation** (text required, page optional); swipe or menu to edit/delete.

## List filters (Phase B partial)

- Filter by **tag** and **series** (in addition to status).
- Title search remains title-only (FR-013).

## Desktop / mobile

- Full parity for Phase B (unlike Phase A scan boundary).
