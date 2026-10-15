# Contract: External music links (MU1b, MU-links)

## `buildSpotifySearchUrl({ title, artist? })`

Returns HTTPS URL opening Spotify search with encoded query `artist + title` or title alone.

## `buildSoundCloudSearchUrl({ title, artist? })`

Same for SoundCloud search.

## Row URLs

- When `spotifyUrl` / `soundcloudUrl` set and valid HTTPS, primary buttons open those URLs.
- Deep-link actions always available as secondary when query text known.

## Constraints

- No Spotify/SC API calls; no embedded players (MU-scope).
