import { MusicCatalogSearchError } from "@/application/ports/music-catalog-search";

const USER_AGENT = "Muni/0.1 (music catalog; +https://github.com/Kroustille/muni)";
const MIN_INTERVAL_MS = 1100;
const RETRYABLE_STATUSES = new Set([502, 503, 429]);
const MAX_ATTEMPTS = 4;

export type MusicBrainzFetch = (url: string) => Promise<Response>;

export function createMusicBrainzFetch(fetchFn: typeof fetch): MusicBrainzFetch {
  let nextSlotMs = 0;

  async function waitForSlot(): Promise<void> {
    const now = Date.now();
    const start = Math.max(now, nextSlotMs);
    nextSlotMs = start + MIN_INTERVAL_MS;
    const delay = start - now;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return async (url: string): Promise<Response> => {
    let lastStatus = 0;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await waitForSlot();
      const response = await fetchFn(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (response.ok) return response;
      lastStatus = response.status;
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS - 1) {
        throw new MusicCatalogSearchError(`MusicBrainz request failed (${response.status})`);
      }
      const backoffMs = MIN_INTERVAL_MS * (attempt + 2);
      nextSlotMs = Date.now() + backoffMs;
    }
    throw new MusicCatalogSearchError(`MusicBrainz request failed (${lastStatus})`);
  };
}

export async function fetchMusicBrainzJson<T>(mbFetch: MusicBrainzFetch, url: string): Promise<T> {
  const response = await mbFetch(url);
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new MusicCatalogSearchError("MusicBrainz response was not valid JSON", error);
  }
}
