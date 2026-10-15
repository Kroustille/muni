const IMDB_ID_PATTERN = /^tt\d+$/;

export function isValidImdbId(value: string): boolean {
  return IMDB_ID_PATTERN.test(value.trim());
}

export function normalizeImdbId(value: string): string {
  const trimmed = value.trim();
  if (!isValidImdbId(trimmed)) {
    throw new Error("invalid IMDb id");
  }
  return trimmed;
}
