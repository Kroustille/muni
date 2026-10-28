import { isValidIsbn, normalizeIsbn } from "@/domain/isbn";
import { normalizeText } from "@/domain/text";

const FRENCH_ARTICLE_PREFIX =
  /^(?:de la |de l'|l'|la |le |les |un |une |des |du |d')\s*/iu;

/** Collapse whitespace and strip leading French articles for Open Library title search. */
export function prepareBookCatalogTitleSearchQuery(query: string): string {
  let text = query.trim().replace(/\s+/g, " ");
  while (true) {
    const stripped = text.replace(FRENCH_ARTICLE_PREFIX, "");
    if (stripped === text) break;
    text = stripped.trim();
  }
  return text;
}

export type ParsedBookCatalogSearchQuery =
  | { kind: "isbn"; isbn: string }
  | { kind: "title"; searchText: string };

export function parseBookCatalogSearchQuery(raw: string): ParsedBookCatalogSearchQuery {
  const trimmed = raw.trim();
  if (isValidIsbn(trimmed)) {
    return { kind: "isbn", isbn: normalizeIsbn(trimmed) };
  }
  return { kind: "title", searchText: prepareBookCatalogTitleSearchQuery(trimmed) };
}

export function bookCatalogSearchCacheKey(query: string, limit: number): string {
  const parsed = parseBookCatalogSearchQuery(query);
  const normalized =
    parsed.kind === "isbn" ? parsed.isbn : normalizeText(parsed.searchText);
  return `search:${normalized}:${limit}`;
}
