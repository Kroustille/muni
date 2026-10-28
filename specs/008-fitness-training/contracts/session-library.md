# Contract: Séance library editor (008)

**Replaces** `program-editor.md` (weekly program UX removed 2026-10-28).

## Route

- **`/fitness/sessions`** — **Mes séances** (library of session templates).

## Surfaces

- List of **séance templates** (title + exercise count summary).
- Add template, edit template, **delete template** per row: **Supprimer** → soft delete + **Annuler** undo (FR-050, FR-013) — immediate persist, not only on batch save exit.
- Per template: **title** + ordered **catalog exercises** (optional default sets/reps/notes).
- **No weekday chips** — scheduling is separate (**planifier** from home or future date picker).

## Exercise row

- Catalog picker (FR-026); no free-text exercise names.

## Save

- Persists `FitnessSessionTemplate` rows locally; sync via `sessionTemplates[]` push.

## Related

- **Planifier**: creates `FitnessScheduledSession` (one template + one calendar date) — see fitness home contract / schedule use cases.
