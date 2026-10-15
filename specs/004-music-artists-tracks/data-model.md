# Data Model: Music (004)

## Item types

Extend `ITEM_TYPES` with `music_artist` and `music_track`.

### `music_artist`

| Field | Rules |
|-------|-------|
| `title` | Artist name, required |
| `notes`, `recommendedBy` | optional text |
| `musicBrainzArtistId` | UUID MBID, dedupe key |
| `spotifyUrl`, `soundcloudUrl` | optional HTTPS URLs |

### `music_track`

| Field | Rules |
|-------|-------|
| `title` | required |
| `artist` | required text (MU5), not FK |
| `album`, `releaseYear` | optional |
| `status` | `to_listen` \| `listened` |
| `rating` | 1–5 when listened |
| `musicBrainzRecordingId` | dedupe key |
| `spotifyUrl`, `soundcloudUrl` | optional |
| `notes`, `recommendedBy` | optional |

## DTOs

- `MusicArtistSearchHit`, `MusicTrackSearchHit` — normalized catalog rows for UI.

## Dedupe (MU2)

- Artist saves: unique `musicBrainzArtistId` per user among active+deleted handling restore.
- Track saves: unique `musicBrainzRecordingId` per user.
