export type MusicArtistSearchHit = {
  musicBrainzArtistId: string;
  name: string;
  disambiguation?: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
};

export type MusicTrackSearchHit = {
  musicBrainzRecordingId: string;
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  spotifyUrl?: string;
  soundcloudUrl?: string;
};

export class MusicCatalogSearchError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MusicCatalogSearchError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export interface MusicCatalogSearch {
  searchArtists(query: string, limit?: number): Promise<MusicArtistSearchHit[]>;
  searchRecordings(query: string, limit?: number): Promise<MusicTrackSearchHit[]>;
}
