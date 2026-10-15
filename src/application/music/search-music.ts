import type {
  MusicArtistSearchHit,
  MusicCatalogSearch,
  MusicTrackSearchHit,
} from "@/application/ports/music-catalog-search";

export type SearchMusicArtistsDeps = {
  catalog: MusicCatalogSearch;
};

export type SearchMusicTracksDeps = {
  catalog: MusicCatalogSearch;
};

export type SearchMusicArtists = (query: string, limit?: number) => Promise<MusicArtistSearchHit[]>;
export type SearchMusicTracks = (query: string, limit?: number) => Promise<MusicTrackSearchHit[]>;

export function createSearchMusicArtists(deps: SearchMusicArtistsDeps): SearchMusicArtists {
  return async (query: string, limit?: number) => {
    const trimmed = query.trim();
    if (trimmed === "") return [];
    return deps.catalog.searchArtists(trimmed, limit);
  };
}

export function createSearchMusicTracks(deps: SearchMusicTracksDeps): SearchMusicTracks {
  return async (query: string, limit?: number) => {
    const trimmed = query.trim();
    if (trimmed === "") return [];
    return deps.catalog.searchRecordings(trimmed, limit);
  };
}
