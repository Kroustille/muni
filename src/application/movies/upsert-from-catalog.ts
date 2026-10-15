import { formatHlc, parseHlc, tickHlc, type Hlc } from "../../domain/clock";
import { normalizeImdbId } from "../../domain/imdb";
import { newItem, updateItem, type Item, type ItemPatch, type MediaKind } from "../../domain/item";
import { normalizeText } from "../../domain/text";
import type { IdGenerator } from "../ports/id-generator";
import type { ItemRepository } from "../ports/item-repository";

export type UpsertMovieFromCatalogInput = {
  imdbId?: string | null;
  title: string;
  synopsis?: string | null;
  releaseYear?: number | null;
  catalogRating?: number | null;
  mediaKind?: MediaKind | null;
};

export type UpsertMovieFromCatalogDeps = {
  repository: ItemRepository;
  idGenerator: IdGenerator;
  now: () => number;
};

function catalogPatch(input: UpsertMovieFromCatalogInput): ItemPatch {
  const patch: ItemPatch = {
    title: input.title.trim(),
    synopsis: input.synopsis ?? null,
    releaseYear: input.releaseYear ?? null,
    catalogRating: input.catalogRating ?? null,
    mediaKind: input.mediaKind ?? null,
    deletedAt: null,
  };
  if (input.imdbId != null && input.imdbId.trim() !== "") {
    patch.imdbId = normalizeImdbId(input.imdbId);
  }
  return patch;
}

function yearsMatch(stored: number | null, catalogYear: number | null | undefined): boolean {
  if (stored === null || catalogYear === null || catalogYear === undefined) return true;
  return stored === catalogYear;
}

function findManualMergeCandidate(
  movies: Item[],
  catalogTitle: string,
  catalogYear: number | null | undefined,
): Item | undefined {
  const titleKey = normalizeText(catalogTitle);
  const candidates = movies.filter(
    (movie) =>
      movie.deletedAt === null &&
      (movie.imdbId === null || movie.imdbId === "") &&
      normalizeText(movie.title) === titleKey &&
      yearsMatch(movie.releaseYear, catalogYear),
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function createUpsertMovieFromCatalog({
  repository,
  idGenerator,
  now,
}: UpsertMovieFromCatalogDeps) {
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

  return async function upsertMovieFromCatalog(input: UpsertMovieFromCatalogInput): Promise<Item> {
    const movies = await repository.query({ type: "movie", includeDeleted: true });
    const imdbId =
      input.imdbId != null && input.imdbId.trim() !== ""
        ? normalizeImdbId(input.imdbId)
        : null;

    let active: Item | undefined;
    let deleted: Item | undefined;
    if (imdbId !== null) {
      const byImdb = movies.filter((movie) => movie.imdbId === imdbId);
      active = byImdb.find((movie) => movie.deletedAt === null);
      deleted = byImdb.find((movie) => movie.deletedAt !== null);
    }

    const patch = await stampPatch(catalogPatch({ ...input, imdbId }));

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

    const manual = findManualMergeCandidate(movies, input.title, input.releaseYear);
    if (manual !== undefined) {
      const updated = updateItem(manual, patch);
      await repository.put(updated, { enqueue: true });
      return updated;
    }

    const createdAt = new Date(now()).toISOString();
    const { fieldsUpdatedAt: _ignored, deletedAt: _del, ...createFields } = patch;
    const created = newItem({
      id: idGenerator.newId(),
      type: "movie",
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
