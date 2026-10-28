# Contract: Learning piece UI

**Applies to**: User stories C3–C4, FR-018, FR-020–FR-021.

## List (Répertoire)

- Quick-add **title** → status **En apprentissage** (`learning`).
- Row: title, instrument name, status badge, `lastPracticedAt`.
- Filter by status (P1); search title locally.

## Detail

- Status picker: En apprentissage, À l’aise, En pause, Archivé.
- Optional instrument, startedAt, notes.
- **Pratiqué** action: opens log form with `learningPieceId` preset (same as logging from today).
- **P2**: **Référence écoute** — [track-link-picker.md](track-link-picker.md); label clarifies this does **not** mark track as écouté.

## Orphan 004 link

Display « Piste supprimée » when linked track missing locally; allow clear link.

## 011 note

Only `practice_log.practicedAt` is recap-eligible in future 011 work — not status change alone unless product expands (research PD-012-5).
