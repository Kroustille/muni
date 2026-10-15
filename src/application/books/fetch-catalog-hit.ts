import type { BookCatalogHit } from "@/application/ports/book-catalog-lookup";

export class BookCatalogLookupClientError extends Error {
  readonly code: "invalid_isbn" | "not_found" | "provider_error" | "unauthorized" | "network";

  constructor(code: BookCatalogLookupClientError["code"], message?: string) {
    super(message ?? code);
    this.name = "BookCatalogLookupClientError";
    this.code = code;
  }
}

export type FetchBookCatalogHitDeps = {
  fetch?: typeof fetch;
  baseUrl?: string;
};

export async function fetchBookCatalogHit(
  rawIsbn: string,
  deps: FetchBookCatalogHitDeps = {},
): Promise<BookCatalogHit> {
  const fetchFn = deps.fetch ?? fetch;
  const base = deps.baseUrl ?? "";
  const url = `${base}/api/books/lookup?isbn=${encodeURIComponent(rawIsbn)}`;
  let response: Response;
  try {
    response = await fetchFn(url, { credentials: "include" });
  } catch {
    throw new BookCatalogLookupClientError("network");
  }

  if (response.status === 401) {
    throw new BookCatalogLookupClientError("unauthorized");
  }
  if (response.status === 400) {
    throw new BookCatalogLookupClientError("invalid_isbn");
  }
  if (response.status === 404) {
    throw new BookCatalogLookupClientError("not_found");
  }
  if (response.status === 502) {
    throw new BookCatalogLookupClientError("provider_error");
  }
  if (!response.ok) {
    throw new BookCatalogLookupClientError("network");
  }
  return (await response.json()) as BookCatalogHit;
}
