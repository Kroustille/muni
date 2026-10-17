import type { StreamingAvailabilityLookup } from "@/application/ports/streaming-availability-lookup";

/** Default v1 adapter until a streaming provider is chosen (OD-003-3). */
export function createNoOpStreamingAvailabilityLookup(): StreamingAvailabilityLookup {
  return {
    async lookupByImdbId() {
      return [];
    },
  };
}
