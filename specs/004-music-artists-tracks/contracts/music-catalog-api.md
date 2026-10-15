# Contract: Music catalog API

## Port: `MusicCatalogSearch`

```typescript
searchArtists(query: string, limit?: number): Promise<MusicArtistSearchHit[]>;
searchRecordings(query: string, limit?: number): Promise<MusicTrackSearchHit[]>;
```

## HTTP

- `GET /api/music/artists/search?q=` → `{ results: MusicArtistSearchHit[] }`
- `GET /api/music/tracks/search?q=` → `{ results: MusicTrackSearchHit[] }`

Session required. MusicBrainz only on server. Cache provider `musicbrainz`.
