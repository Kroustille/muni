import type { StreamingProvider } from "@/domain/item";
import type { CatalogCacheRepository } from "@/application/ports/catalog-cache-repository";
import type { StreamingAvailabilityLookup } from "@/application/ports/streaming-availability-lookup";

export type StreamingLookupDeps = {
  cache: CatalogCacheRepository;
  lookup: StreamingAvailabilityLookup;
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
  const providers = await deps.lookup.lookupByImdbId(trimmed);
  await deps.cache.upsert({
    provider: "movie_streaming",
    cacheKey: trimmed,
    payload: providers,
    fetchedAt: now(),
  });
  return providers;
}
