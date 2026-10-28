# Contract: DJ set workflow UI

**Applies to**: User stories B1–B4, FR-002, FR-005, FR-007–FR-009.

## List

- Quick-add: title → default status **Prévu**.
- Filters: Prévu / Joué (P1).
- Row: title, status, `performedAt` when joué.

## Detail

- Status: Prévu → Joué / Annulé.
- When **Joué**: **performedAt** required (date picker; backdate OK).
- **Setlist**: ordered lines; add/remove/reorder; free text per line (P1).
- **P2**: per-line optional track link via [track-link-picker.md](track-link-picker.md).
- **externalUrl**: recording link opens externally.

## Validation (French)

- « Indiquez la date du set » when Joué without date.
- Future `performedAt` rejected.

## Planned → performed

Preserve title, venue, notes; user fills date and setlist after event (US B2).
