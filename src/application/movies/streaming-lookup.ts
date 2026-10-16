import type { StreamingProvider } from "@/domain/item";
import type { CatalogCacheRepository } from "@/application/ports/catalog-cache-repository";

export type StreamingLookupDeps = {
  cache: CatalogCacheRepository;
  now?: () => Date;
};

export async function lookupMovieStreaming(
  imdbId: string,
  deps: StreamingLookupDeps,
): Promise<StreamingProvider[]> {
  const trimmed = imdbId.trim();
  if (trimmed === "") return [];
  const now = deps.now ?? (() => new Date());
  const cached = await deps.cache.get("movie_streaming", trimmed, now());
  if (cached !== null) {
    return Array.isArray(cached) ? (cached as StreamingProvider[]) : [];
  }
  const empty: StreamingProvider[] = [];
  await deps.cache.upsert({
    provider: "movie_streaming",
    cacheKey: trimmed,
    payload: empty,
    fetchedAt: now(),
  });
  return empty;
}
