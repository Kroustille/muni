import { isValidIsbn, normalizeIsbn } from "@/domain/isbn";
import type { BookCatalogHit } from "@/application/ports/book-catalog-lookup";

export type OpenLibrarySearchDoc = {
  title?: string;
  author_name?: string[];
  isbn?: string[];
  first_publish_year?: number;
  publisher?: string[];
};

export type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

function pickIsbn(isbns: unknown): string | undefined {
  if (!Array.isArray(isbns)) return undefined;
  for (const raw of isbns) {
    if (typeof raw !== "string") continue;
    if (!isValidIsbn(raw)) continue;
    try {
      return normalizeIsbn(raw);
    } catch {
      continue;
    }
  }
  return undefined;
}

export function mapSearchResponseToHits(
  payload: OpenLibrarySearchResponse,
  maxResults: number,
): BookCatalogHit[] {
  const docs = payload.docs ?? [];
  const hits: BookCatalogHit[] = [];
  for (const doc of docs) {
    if (hits.length >= maxResults) break;
    const title = doc.title?.trim();
    if (!title) continue;
    const isbn = pickIsbn(doc.isbn);
    if (!isbn) continue;
    const hit: BookCatalogHit = { isbn, title };
    const authors = doc.author_name?.map((name) => name.trim()).filter((name) => name !== "");
    if (authors && authors.length > 0) hit.author = authors.join(", ");
    if (
      typeof doc.first_publish_year === "number" &&
      doc.first_publish_year >= 1000 &&
      doc.first_publish_year <= 2100
    ) {
      hit.publicationYear = doc.first_publish_year;
    }
    const publisher = doc.publisher?.[0]?.trim();
    if (publisher) hit.publisher = publisher;
    hits.push(hit);
  }
  return hits;
}
