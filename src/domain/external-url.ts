const HTTPS_URL_PATTERN = /^https:\/\/.+/i;

export function isValidHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!HTTPS_URL_PATTERN.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeHttpsUrl(value: string): string {
  const trimmed = value.trim();
  if (!isValidHttpsUrl(trimmed)) {
    throw new Error("invalid HTTPS URL");
  }
  return trimmed;
}
