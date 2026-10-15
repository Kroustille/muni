import type { MediaKind } from "@/domain/item";
import { isValidImdbId } from "@/domain/imdb";
import type { MovieCatalogDetail, MovieSearchHit } from "@/application/ports/movie-catalog-search";

/** Wikidata: film (Q11424), television series (Q5398426). */
export const WIKIDATA_FILM_QID = "Q11424";
export const WIKIDATA_SERIES_QID = "Q5398426";

/** Excluded instance-of targets (seasons, episodes). */
const EXCLUDED_INSTANCE_QIDS = new Set([
  "Q3464665", // television season
  "Q21191270", // television episode
  "Q182429", // film series (collection)
]);

type WikidataEntity = {
  labels?: Record<string, { value?: string }>;
  descriptions?: Record<string, { value?: string }>;
  claims?: Record<string, WikidataClaim[]>;
};

type WikidataClaim = {
  mainsnak?: {
    datavalue?: {
      type?: string;
      value?: unknown;
    };
  };
};

type WikidataEntitiesResponse = {
  entities?: Record<string, WikidataEntity | { missing?: string }>;
};

type WikidataSearchResponse = {
  search?: Array<{ id?: string; label?: string; description?: string }>;
};

function readLabel(entity: WikidataEntity, preferredLang = "fr"): string | undefined {
  const fr = entity.labels?.[preferredLang]?.value?.trim();
  if (fr) return fr;
  const en = entity.labels?.en?.value?.trim();
  return en || undefined;
}

function instanceQids(entity: WikidataEntity): string[] {
  const claims = entity.claims?.P31 ?? [];
  const ids: string[] = [];
  for (const claim of claims) {
    const value = claim.mainsnak?.datavalue?.value;
    if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
      ids.push(value.id);
    }
  }
  return ids;
}

export function resolveMediaKind(entity: WikidataEntity): MediaKind | null {
  const instances = instanceQids(entity);
  if (instances.some((id) => EXCLUDED_INSTANCE_QIDS.has(id))) return null;
  if (instances.includes(WIKIDATA_SERIES_QID)) return "series";
  if (instances.includes(WIKIDATA_FILM_QID)) return "film";
  return null;
}

function readImdbId(entity: WikidataEntity): string | undefined {
  for (const claim of entity.claims?.P345 ?? []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (typeof value === "string" && isValidImdbId(value)) {
      return value.trim();
    }
  }
  return undefined;
}

function readReleaseYear(entity: WikidataEntity): number | undefined {
  for (const claim of entity.claims?.P577 ?? []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (value && typeof value === "object" && "time" in value && typeof value.time === "string") {
      const match = value.time.match(/([+-]?\d{4})/);
      if (!match) continue;
      const year = Number(match[1].replace(/^\+/, ""));
      if (year >= 1000 && year <= 2100) return year;
    }
  }
  return undefined;
}

function readCatalogRating(entity: WikidataEntity): number | undefined {
  for (const claim of entity.claims?.P444 ?? []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 10) return parsed;
    }
    if (typeof value === "number" && value >= 0 && value <= 10) return value;
  }
  return undefined;
}

function readSynopsis(entity: WikidataEntity, preferredLang = "fr"): string | undefined {
  for (const claim of entity.claims?.P1922 ?? []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") return trimmed;
    }
    if (value && typeof value === "object" && "text" in value && typeof value.text === "string") {
      const trimmed = value.text.trim();
      if (trimmed !== "") return trimmed;
    }
  }
  const desc = entity.descriptions?.[preferredLang]?.value?.trim();
  if (desc) return desc;
  return entity.descriptions?.en?.value?.trim() || undefined;
}

export function mapEntityToMovieHit(
  entity: WikidataEntity,
  wikidataId: string,
): MovieSearchHit | null {
  const mediaKind = resolveMediaKind(entity);
  if (mediaKind === null) return null;
  const title = readLabel(entity);
  if (!title) return null;

  const hit: MovieSearchHit = { wikidataId, title, mediaKind };
  const imdbId = readImdbId(entity);
  if (imdbId) hit.imdbId = imdbId;
  const releaseYear = readReleaseYear(entity);
  if (releaseYear !== undefined) hit.releaseYear = releaseYear;
  const catalogRating = readCatalogRating(entity);
  if (catalogRating !== undefined) hit.catalogRating = catalogRating;
  return hit;
}

export function mapEntityToMovieDetail(
  entity: WikidataEntity,
  wikidataId: string,
): MovieCatalogDetail | null {
  const hit = mapEntityToMovieHit(entity, wikidataId);
  if (hit === null) return null;
  const synopsis = readSynopsis(entity);
  if (synopsis) return { ...hit, synopsis };
  return hit;
}

export function mapEntitiesResponseToHits(
  response: WikidataEntitiesResponse,
  ids: string[],
): MovieSearchHit[] {
  const hits: MovieSearchHit[] = [];
  const entities = response.entities ?? {};
  for (const id of ids) {
    const raw = entities[id];
    if (!raw || "missing" in raw || !("labels" in raw || "claims" in raw)) continue;
    const hit = mapEntityToMovieHit(raw as WikidataEntity, id);
    if (hit) hits.push(hit);
  }
  return hits;
}

export function mapSearchResponseIds(response: WikidataSearchResponse): string[] {
  const ids: string[] = [];
  for (const entry of response.search ?? []) {
    if (typeof entry.id === "string" && entry.id.startsWith("Q")) {
      ids.push(entry.id);
    }
  }
  return ids;
}

export function mapEntityResponseToDetail(
  response: WikidataEntitiesResponse,
  wikidataId: string,
): MovieCatalogDetail | null {
  const entity = response.entities?.[wikidataId];
  if (!entity || "missing" in entity) return null;
  return mapEntityToMovieDetail(entity as WikidataEntity, wikidataId);
}
