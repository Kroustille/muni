# Contract: External music links (MU1b, MU-links)

## `buildSpotifySearchUrl({ title, artist? })`

Returns HTTPS URL opening Spotify search with encoded query `artist + title` or title alone.

## `buildSoundCloudSearchUrl({ title, artist? })`

Same for SoundCloud search.

## Catalog preview (MU1b)

- When the user picks a MusicBrainz hit, the preview form **prefills** `spotifyUrl` and `soundcloudUrl` with `buildSpotifySearchUrl` / `buildSoundCloudSearchUrl` from title (+ artist for tracks) unless the hit already has stored URLs.
- No separate “search on Spotify/SoundCloud” buttons on catalog preview; the user edits or saves the prefilled URL fields.

## Row URLs (detail / edit)

- Optional **Ouvrir sur Spotify** / **Ouvrir sur SoundCloud** buttons only when the row has a non-empty URL in that field.

## Constraints

- No Spotify/SC API calls; no embedded players (MU-scope).
