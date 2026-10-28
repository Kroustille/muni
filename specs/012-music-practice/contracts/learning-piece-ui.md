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

Recap-eligible: **`practice_log.practicedAt`** per [011 FR-006](../011-periodic-recap/spec.md). **`learning_piece` → `comfortable`** alone is **not** recap-eligible in MVP — see [011 spec](../011-periodic-recap/spec.md) clarifications **2026-10-28 (Musique in recap)**.
