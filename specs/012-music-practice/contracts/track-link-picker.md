# Contract: 004 track link picker (P2)

**Applies to**: FR-012, FR-020, setlist lines, composition inspirations, learning piece reference.

## Behavior

- Modal or combobox searching **local** 004 `music_track` items (existing search index / list use case).
- On select: store **track item uuid** only — no write to track `status`.
- Display: track title + artist if available from local item graph.
- Clear link removes id; free-text setlist line unchanged on DJ rows.

## Copy (French)

- Learning piece section title: « Référence (bibliothèque d’écoute) »
- Helper: « N’ajoute pas la piste à vos écoutes — lien de référence seulement. »

## Orphan handling

If track soft-deleted or missing after sync, show fallback label and offer **Retirer le lien**.

## Out of scope

- MusicBrainz search from 012 screens (use existing 004 flows to add tracks first).
- Opening in-app player (FR-008).
