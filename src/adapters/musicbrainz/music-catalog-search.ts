import { ensureSearchResultsArray } from "@/domain/ensure-search-results-array";
import type { CatalogCacheRepository } from "@/application/ports/catalog-cache-repository";
import {
  MusicCatalogSearch,
  MusicCatalogSearchError,
  MusicArtistSearchHit,
  MusicTrackSearchHit,
} from "@/application/ports/music-catalog-search";

import { formatArtistCredit } from "./format-artist-credit";
import { createMusicBrainzFetch, fetchMusicBrainzJson } from "./musicbrainz-fetch";

const DEFAULT_API = "https://musicbrainz.org/ws/2";

export type MusicBrainzCatalogSearchDeps = {
  fetch?: typeof fetch;
  apiBase?: string;
  cache?: CatalogCacheRepository;
  now?: () => Date;
};

type MbArtistSearchResponse = {
  artists?: {
    id: string;
    name: string;
    disambiguation?: string;
  }[];
};

type MbRecordingSearchResponse = {
  recordings?: {
    id: string;
    title: string;
    "first-release-date"?: string;
    "artist-credit"?: Array<{ name?: string; joinphrase?: string; artist?: { name?: string } }>;
    releases?: { title: string }[];
  }[];
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function artistCacheKey(query: string, limit: number): string {
  return `artist-search:${normalizeQuery(query)}:${limit}`;
}

function recordingCacheKey(query: string, limit: number): string {
  return `recording-search:${normalizeQuery(query)}:${limit}`;
}

function buildUrl(base: string, path: string, params: Record<string, string>): string {
  const url = new URL(`${base.replace(/\/+$/, "")}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function parseReleaseYear(firstReleaseDate?: string): number | undefined {
  if (firstReleaseDate === undefined || firstReleaseDate.length < 4) return undefined;
  const year = Number.parseInt(firstReleaseDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

function mapArtistResponse(payload: MbArtistSearchResponse): MusicArtistSearchHit[] {
  return (payload.artists ?? []).map((artist) => ({
    musicBrainzArtistId: artist.id,
    name: artist.name,
    disambiguation: artist.disambiguation,
  }));
}

function mapRecordingResponse(payload: MbRecordingSearchResponse): MusicTrackSearchHit[] {
  return (payload.recordings ?? []).map((recording) => ({
    musicBrainzRecordingId: recording.id,
    title: recording.title,
    artist: formatArtistCredit(recording["artist-credit"]),
    album: recording.releases?.[0]?.title,
    releaseYear: parseReleaseYear(recording["first-release-date"]),
  }));
}

async function writeCache(
  cache: CatalogCacheRepository | undefined,
  record: {
    provider: "musicbrainz";
    cacheKey: string;
    payload: unknown;
    fetchedAt: Date;
  },
): Promise<void> {
  if (!cache) return;
  try {
    await cache.upsert(record);
  } catch {
    // Search should succeed even when cache persistence fails.
  }
}

export function createMusicBrainzCatalogSearch(
  deps: MusicBrainzCatalogSearchDeps = {},
): MusicCatalogSearch {
  const fetchFn = deps.fetch ?? fetch;
  const apiBase = deps.apiBase ?? DEFAULT_API;
  const mbFetch = createMusicBrainzFetch(fetchFn);

  return {
    async searchArtists(query: string, limit = 20): Promise<MusicArtistSearchHit[]> {
      const trimmed = query.trim();
      if (trimmed === "") return [];
      const capped = Math.min(Math.max(1, limit), 20);
      const now = deps.now?.() ?? new Date();
      const cacheKey = artistCacheKey(trimmed, capped);

      if (deps.cache) {
        const cached = await deps.cache.get("musicbrainz", cacheKey, now);
        if (cached !== null) {
          if (Array.isArray(cached)) return cached as MusicArtistSearchHit[];
          const recovered = ensureSearchResultsArray<MusicArtistSearchHit>(cached);
          if (recovered.length > 0) return recovered;
        }
      }

      try {
        const url = buildUrl(apiBase, "artist", {
          query: trimmed,
          fmt: "json",
          limit: String(capped),
        });
        const payload = await fetchMusicBrainzJson<MbArtistSearchResponse>(mbFetch, url);
        const hits = mapArtistResponse(payload);
        await writeCache(deps.cache, {
          provider: "musicbrainz",
          cacheKey,
          payload: hits,
          fetchedAt: now,
        });
        return hits;
      } catch (error) {
        if (error instanceof MusicCatalogSearchError) throw error;
        throw new MusicCatalogSearchError("MusicBrainz artist search failed", error);
      }
    },

    async searchRecordings(query: string, limit = 20): Promise<MusicTrackSearchHit[]> {
      const trimmed = query.trim();
      if (trimmed === "") return [];
      const capped = Math.min(Math.max(1, limit), 20);
      const now = deps.now?.() ?? new Date();
      const cacheKey = recordingCacheKey(trimmed, capped);

      if (deps.cache) {
        const cached = await deps.cache.get("musicbrainz", cacheKey, now);
        if (cached !== null) {
          if (Array.isArray(cached)) return cached as MusicTrackSearchHit[];
          const recovered = ensureSearchResultsArray<MusicTrackSearchHit>(cached);
          if (recovered.length > 0) return recovered;
        }
      }

      try {
        const url = buildUrl(apiBase, "recording", {
          query: trimmed,
          fmt: "json",
          limit: String(capped),
        });
        const payload = await fetchMusicBrainzJson<MbRecordingSearchResponse>(mbFetch, url);
        const hits = mapRecordingResponse(payload).filter((hit) => hit.artist !== "");
        await writeCache(deps.cache, {
          provider: "musicbrainz",
          cacheKey,
          payload: hits,
          fetchedAt: now,
        });
        return hits;
      } catch (error) {
        if (error instanceof MusicCatalogSearchError) throw error;
        throw new MusicCatalogSearchError("MusicBrainz recording search failed", error);
      }
    },
  };
}
