import { ensureSearchResultsArray } from "@/domain/ensure-search-results-array";
import type { BookCatalogHit } from "@/application/ports/book-catalog-lookup";

export class BookCatalogSearchClientError extends Error {
  readonly code: "provider_error" | "unauthorized" | "network" | "missing_query";

  constructor(code: BookCatalogSearchClientError["code"], message?: string) {
    super(message ?? code);
    this.name = "BookCatalogSearchClientError";
    this.code = code;
  }
}

export type FetchBookCatalogSearchDeps = {
  fetch?: typeof fetch;
  baseUrl?: string;
};

export async function fetchBookCatalogSearch(
  query: string,
  deps: FetchBookCatalogSearchDeps = {},
): Promise<BookCatalogHit[]> {
  const fetchFn = deps.fetch ?? fetch;
  const base = deps.baseUrl ?? "";
  const url = `${base}/api/books/search?q=${encodeURIComponent(query)}`;
  let response: Response;
  try {
    response = await fetchFn(url, { credentials: "include" });
  } catch {
    throw new BookCatalogSearchClientError("network");
  }

  if (response.status === 401) throw new BookCatalogSearchClientError("unauthorized");
  if (response.status === 400) throw new BookCatalogSearchClientError("missing_query");
  if (response.status === 502) throw new BookCatalogSearchClientError("provider_error");
  if (!response.ok) throw new BookCatalogSearchClientError("network");

  const body = (await response.json()) as { results?: unknown };
  return ensureSearchResultsArray<BookCatalogHit>(body.results);
}
