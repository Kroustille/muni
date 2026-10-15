const MBID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidMusicBrainzId(value: string): boolean {
  return MBID_PATTERN.test(value.trim());
}

export function normalizeMusicBrainzId(value: string): string {
  const trimmed = value.trim();
  if (!isValidMusicBrainzId(trimmed)) {
    throw new Error("invalid MusicBrainz id");
  }
  return trimmed.toLowerCase();
}
