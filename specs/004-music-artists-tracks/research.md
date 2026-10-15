# Research: Music artists and tracks (004)

## 1. Catalog (MU1)

- **Decision**: MusicBrainz web service JSON search for artists and recordings; no API key; polite rate limit + cache (X4).
- **Rationale**: Keyless; MBIDs for MU2.
- **Alternatives**: Discogs (key); Spotify API (forbidden MU1b).

## 2. Hybrid external (MU1b)

- **Decision**: In-app MB search; `openExternalSearch(platform, { title, artist? })` builds encoded query URLs; no OAuth.
- **Rationale**: Findability without keys.

## 3. URL fields (MU-links)

- **Decision**: Optional validated HTTPS URLs on rows; paste on preview; MusicBrainz relations may prefill when present in MB response (optional P2 enrichment).
- **Rationale**: Complements deep links.

## 4. Item modeling (MU3)

- **Decision**: Two `ItemType` values `music_artist` and `music_track` sharing home navigation; track `artist` as free text column; suggestions query distinct artist item titles.
- **Rationale**: No FK; suggestions only.

## 5. Search placement (MU4)

- **Decision**: Catalog search components only on `/music/artists` and `/music/tracks`; quick-add uses manual form validation (MU5).
- **Rationale**: MU4=B.

## 6. Playback (MU-scope)

- **Decision**: No `<audio>`; links open `_blank` / native app via URL.
- **Rationale**: Scope.

## 7. Track status

- **Decision**: `to_listen` | `listened` mirroring movies; rating 1–5 when listened.
- **Rationale**: Consistent UX.
