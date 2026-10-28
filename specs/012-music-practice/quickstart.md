# Quickstart: Music practice (012)

**Prerequisites**: Muni **001** on `main`; migration **0016** applied; `yarn db:up` for integration tests.

## Foundation smoke

1. Login → navigate **Musique — pratique** → three tabs visible.
2. DevTools → IndexedDB: stores for composition, dj_set, practice_* entities exist (may be empty).

## P1 — Compositions (A1–A2)

1. Tab **Compositions** → quick-add **Pad dub mars** → appears **Idée**.
2. Offline → open detail → add session note dated today → kill app → reopen → note persists.
3. Set **Terminé** with backdated **finishedAt** → filter **Terminé** → row visible.

## P1 — DJ sets (B1)

1. Tab **Sets DJ** → create **Set salon** as **Joué** with yesterday’s date + three setlist lines offline.
2. Reopen → setlist order preserved.
3. Create **Prévu** → later switch **Joué** → title unchanged.

## P1 — Apprentissage (C1–C3)

1. **Apprentissage** → add instrument **Guitare**.
2. Add exercise **Gamme pentatonique** linked to Guitare.
3. **Plan** → active plan → assign exercise to **today’s weekday**.
4. **Aujourd’hui** → see exercise → **Fait** → recent log appears.
5. **Répertoire** → add piece **Blackbird** → log practice linked to piece → **lastPracticedAt** updates.

## P1 — Sync

1. Device A offline: composition + practice log → sync online.
2. Device B pull → same rows and dates.
3. Concurrent LWW: A edits setlist, B edits DJ title → per-field merge after sync.

## P2 — Track link (when implemented)

1. Learning piece → link existing 004 track → verify track detail still **à écouter** if it was before.
2. DJ setlist line link → unlink → text remains.

## Quality gate

- `yarn typecheck`
- `tests/unit/music-practice/*`, `tests/integration/music-practice-sync.test.ts`
- `tests/e2e/music-practice.spec.ts`
- `yarn verify:ci` before push to `main`
