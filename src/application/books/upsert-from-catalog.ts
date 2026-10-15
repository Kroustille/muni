import { formatHlc, parseHlc, tickHlc, type Hlc } from "../../domain/clock";
import { newItem, updateItem, type Item, type ItemPatch } from "../../domain/item";
import { normalizeIsbn } from "../../domain/isbn";
import { normalizeText } from "../../domain/text";
import type { IdGenerator } from "../ports/id-generator";
import type { ItemRepository } from "../ports/item-repository";

export type UpsertBookFromCatalogInput = {
  isbn: string;
  title: string;
  author?: string | null;
  synopsis?: string | null;
  genres?: string[] | null;
  publicationYear?: number | null;
  publisher?: string | null;
  pageCount?: number | null;
};

export type UpsertBookFromCatalogDeps = {
  repository: ItemRepository;
  idGenerator: IdGenerator;
  now: () => number;
};

function catalogPatch(input: UpsertBookFromCatalogInput): ItemPatch {
  return {
    isbn: normalizeIsbn(input.isbn),
    title: input.title.trim(),
    author: input.author ?? null,
    synopsis: input.synopsis ?? null,
    genres: input.genres ?? null,
    publicationYear: input.publicationYear ?? null,
    publisher: input.publisher ?? null,
    pageCount: input.pageCount ?? null,
    deletedAt: null,
  };
}

function authorsMatch(stored: string | null, catalogAuthor: string | null | undefined): boolean {
  if (stored === null || stored.trim() === "") return true;
  if (catalogAuthor === null || catalogAuthor === undefined || catalogAuthor.trim() === "") {
    return true;
  }
  return normalizeText(stored) === normalizeText(catalogAuthor);
}

function findManualMergeCandidate(
  books: Item[],
  catalogTitle: string,
  catalogAuthor: string | null | undefined,
): Item | undefined {
  const titleKey = normalizeText(catalogTitle);
  const candidates = books.filter(
    (book) =>
      book.deletedAt === null &&
      (book.isbn === null || book.isbn === "") &&
      normalizeText(book.title) === titleKey &&
      authorsMatch(book.author, catalogAuthor),
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function createUpsertBookFromCatalog({
  repository,
  idGenerator,
  now,
}: UpsertBookFromCatalogDeps) {
  async function deviceId(): Promise<string> {
    const existing = await repository.meta.get("deviceId");
    if (existing !== undefined) return existing;
    const created = idGenerator.newId();
    await repository.meta.set("deviceId", created);
    return created;
  }

  async function loadClock(): Promise<Hlc | null> {
    const state = await repository.meta.get("hlcState");
    return state === undefined ? null : parseHlc(state);
  }

  async function nextStamp(): Promise<string> {
    const next = tickHlc(await loadClock(), await deviceId(), now());
    const stamp = formatHlc(next);
    await repository.meta.set("hlcState", stamp);
    return stamp;
  }

  async function stampPatch(patch: ItemPatch): Promise<ItemPatch> {
    const stamp = await nextStamp();
    const keys = Object.keys(patch).filter((key) => key !== "fieldsUpdatedAt");
    return {
      ...patch,
      fieldsUpdatedAt: Object.fromEntries(keys.map((key) => [key, stamp])),
    };
  }

  return async function upsertBookFromCatalog(input: UpsertBookFromCatalogInput): Promise<Item> {
    const isbn = normalizeIsbn(input.isbn);
    const books = await repository.query({ type: "book", includeDeleted: true });
    const byIsbn = books.filter((book) => book.isbn === isbn);
    const active = byIsbn.find((book) => book.deletedAt === null);
    const deleted = byIsbn.find((book) => book.deletedAt !== null);

    const patch = await stampPatch(catalogPatch({ ...input, isbn }));

    if (active !== undefined) {
      const updated = updateItem(active, patch);
      await repository.put(updated, { enqueue: true });
      return updated;
    }

    if (deleted !== undefined) {
      const updated = updateItem(deleted, patch);
      await repository.put(updated, { enqueue: true });
      return updated;
    }

    const manual = findManualMergeCandidate(books, input.title, input.author);
    if (manual !== undefined) {
      const updated = updateItem(manual, patch);
      await repository.put(updated, { enqueue: true });
      return updated;
    }

    const createdAt = new Date(now()).toISOString();
    const { fieldsUpdatedAt: _ignored, deletedAt: _del, ...createFields } = patch;
    const created = newItem({
      id: idGenerator.newId(),
      type: "book",
      title: input.title.trim(),
      createdAt,
      ...createFields,
    });
    const stamp = await nextStamp();
    const provided = Object.entries(createFields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key]) => key);
    const stamped: Item = {
      ...created,
      fieldsUpdatedAt: Object.fromEntries(["title", ...provided].map((key) => [key, stamp])),
    };
    await repository.put(stamped, { enqueue: true });
    return stamped;
  };
}
