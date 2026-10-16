/** Strip Open Library path prefix from a work key (e.g. `/works/OL45804W` → `OL45804W`). */
export function normalizeOpenLibraryWorkKey(raw: string): string {
  return raw.replace(/^\/works\//, "").trim();
}
