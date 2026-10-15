# Implementation Plan: Music artists and tracks

**Branch**: `004-music-artists-tracks` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Build order (X1)**: Implement **after feature 003** is complete. This is the third catalog feature in the 002 → 003 → 004 sequence.

## Summary

Add `music_artist` and `music_track` item types (or parallel list routes). MusicBrainz keyless lookup through server with cache. List-only catalog search; quick-add manual. Hybrid external discovery: URL fields plus Spotify/SoundCloud deep-link helpers (no API keys). No playback.

## Technical Context

**Stack**: Existing Muni hexagonal Next.js app.

**Catalog**: MusicBrainz WS2 (`/artist`, `/recording` search) via server adapter.

**Deep links**: Construct `https://open.spotify.com/search/{query}` and `https://soundcloud.com/search?q={query}` (or documented mobile schemes) from title/artist text — MU1b.

**Storage**: New item types and columns; reuse `catalog_cache` provider `musicbrainz`.

**Testing**: Port tests with fixtures; e2e list search; no audio APIs.

## Constitution Check

All principles **Pass** — offline manual add; capture stays fast on quick-add; typed lists; no playback complexity; server proxy.

## Project Structure

```text
specs/004-music-artists-tracks/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/music-catalog-api.md, contracts/ui-music.md, contracts/external-links.md
└── tasks.md
```

```text
src/application/ports/music-catalog-search.ts
src/adapters/musicbrainz/music-catalog-search.ts
src/application/music/deep-links.ts
src/app/api/music/artists/search/route.ts
src/app/api/music/tracks/search/route.ts
src/app/(app)/music/artists/page.tsx
src/app/(app)/music/tracks/page.tsx
db/migrations/0005_music_item_types.ts
```

## Complexity Tracking

Empty.
