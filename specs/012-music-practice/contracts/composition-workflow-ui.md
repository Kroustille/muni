# Contract: Composition workflow UI

**Applies to**: User stories A1–A3, FR-001, FR-003–FR-004, FR-006–FR-008, FR-010.

## List

- Quick-add field: **title** only → create with status **Idée** (`idea`).
- Row shows: title, French status badge, optional `lastWorkedAt`.
- Filters: status multi-select (P1 minimum: En cours, Terminé).
- Local search on title (`normalizeText`).

## Detail

- Status picker (all non-guilt labels).
- Optional fields per [data-model.md](../data-model.md).
- **Session notes**: append form `{ date (default today), text }`; list chronological.
- **Terminé**: set `finishedAt` default today; date picker allows backdate.
- **externalUrl**: external link button (no embed).
- **P2**: linked tracks section via [track-link-picker.md](track-link-picker.md).

## Validation messages (French)

- Future `finishedAt` rejected.
- Title required on save.

## Offline

All actions persist to IndexedDB immediately; sync icon follows global app pattern.
