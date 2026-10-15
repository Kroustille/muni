/** Catalog search caches and API bodies must expose hit lists as arrays. */
export function ensureSearchResultsArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      return [];
    }
  }
  return [];
}
