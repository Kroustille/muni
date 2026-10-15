# Tasks: Music artists and tracks (004)

**Input**: `/specs/004-music-artists-tracks/`

**Prerequisites**: Features **002** and **003** fully implemented (X1). All design docs present.

**Build order (X1)**: Third in sequence — start only after `specs/003-movie-imdb-search/tasks.md` is complete.

**Task IDs**: **T401–T4xx** (feature 004 band).

---

## Phase 1: Setup

- [x] T401 [P] i18n keys for music lists, search, external links, track status in `src/i18n/fr.json`
- [x] T402 [P] Home navigation entries for artists and tracks in `src/app/(app)/page.tsx` and layout

---

## Phase 2: Foundational

- [x] T403 Extend `ITEM_TYPES` with `music_artist` and `music_track` in `src/domain/item.ts` with field maps per data-model.md
- [x] T404 Unit tests domain validation (track requires artist text MU5, statuses, URL format) in `tests/unit/domain-item-music.test.ts`
- [x] T405 Migration `db/migrations/0006_music_item_types.ts` + codegen
- [x] T405a Migration `db/migrations/0007_music_artist_rating.ts` — allow `rating` on `music_artist` in `items_type_fields` (sync with FR-012)
- [x] T406 Define `MusicCatalogSearch` port in `src/application/ports/music-catalog-search.ts`
- [x] T407 Implement `buildSpotifySearchUrl` / `buildSoundCloudSearchUrl` in `src/application/music/deep-links.ts` with tests in `tests/unit/music-deep-links.test.ts`
- [x] T408 MusicBrainz adapter + cache in `src/adapters/musicbrainz/music-catalog-search.ts` with fixture tests

---

## Phase 3: User Story 1 — Manual add (P1)

- [x] T409 [US1] Artist list page `src/app/(app)/music/artists/page.tsx` (browse, manual add)
- [x] T410 [US1] Track list page `src/app/(app)/music/tracks/page.tsx`
- [x] T411 [US1] Quick-add forms manual only (no catalog) in quick-add router
- [x] T412 [US1] Artist name suggestions for track artist field from artist items
- [x] T413 [US1] IndexedDB + Postgres repository support for new types

---

## Phase 4: User Story 2 — Catalog search on lists (P1)

- [x] T414 [US2] `searchMusicArtists` / `searchMusicTracks` use cases + tests
- [x] T415 [US2] Routes `src/app/api/music/artists/search/route.ts` and `tracks/search/route.ts`
- [x] T416 [US2] Catalog search UI on artists and tracks list only (MU4) with preview
- [x] T417 [US2] `upsertMusicFromCatalog` artist + track variants with MBID dedupe (MU2)

---

## Phase 5: User Story 3 — External links (P1)

- [x] T418 [US3] Preview/detail actions: Search on Spotify / SoundCloud (MU1b)
- [x] T419 [US3] Optional URL fields on preview/edit (MU-links); open in new tab
- [x] T420 [US3] E2e asserts no `<audio>` elements on music pages (MU-scope)

---

## Phase 6: User Story 4 — Ratings, track status, list sort (P2)

- [x] T421 [US4] Track status `to_listen`/`listened` and rating gating like movies
- [x] T421a [US4] Artist optional 1–5 rating on list/detail; **Note** sort on artistes; specs + data-model + ui-music

---

## Phase 7: User Story 5 — Dedupe (P1)

- [x] T422 [US5] Tests restore soft-deleted on same MBID for artist and track

---

## Phase 8: Polish

- [x] T423 Update search index to include music artist title and track title only (L2)
- [x] T424 Local quality gate (no GitHub CI): `yarn typecheck`, `yarn test` / vitest; e2e when Docker stack available; validate quickstart.md

**Sequence note**: Implements catalog feature **004** after **002** books and **003** movies per X1.
