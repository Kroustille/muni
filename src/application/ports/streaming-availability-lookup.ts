import type { StreamingProvider } from "@/domain/item";

/** Third-party or catalog adapter for “where to watch” hints (regional gaps → empty list). */
export interface StreamingAvailabilityLookup {
  lookupByImdbId(imdbId: string): Promise<StreamingProvider[]>;
}
