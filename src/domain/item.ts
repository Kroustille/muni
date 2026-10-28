import { z } from "zod";

import { isValidHttpsUrl } from "./external-url";
import { isValidMusicBrainzId } from "./musicbrainz";
import {
  BOOK_ITEM_FIELD_KEYS,
  BOOK_MOODS,
  BOOK_PACES,
  BOOK_STATUSES,
  bookItemShapeFields,
  refineBookItem,
  type BookMood,
  type BookPace,
  type BookStatus,
} from "./item-book";
import {
  EPISODE_KEY_PATTERN,
  MEDIA_KINDS,
  MOVIE_ITEM_FIELD_KEYS,
  MOVIE_MOODS,
  MOVIE_PACES,
  MOVIE_STATUSES,
  movieItemShapeFields,
  refineMovieItem,
  type EpisodeProgressEntry,
  type EpisodeProgressMap,
  type MediaKind,
  type MovieMood,
  type MoviePace,
  type MovieStatus,
  type StreamingProvider,
} from "./item-movie";

export {
  BOOK_MOODS,
  BOOK_PACES,
  BOOK_STATUSES,
  type BookMood,
  type BookPace,
  type BookStatus,
};
export {
  EPISODE_KEY_PATTERN,
  MEDIA_KINDS,
  MOVIE_MOODS,
  MOVIE_PACES,
  MOVIE_STATUSES,
  type EpisodeProgressEntry,
  type EpisodeProgressMap,
  type MediaKind,
  type MovieMood,
  type MoviePace,
  type MovieStatus,
  type StreamingProvider,
};

export const ITEM_TYPES = [
  "shopping",
  "book",
  "movie",
  "recipe",
  "music_artist",
  "music_track",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

const STATUSES = {
  shopping: [],
  book: BOOK_STATUSES,
  movie: MOVIE_STATUSES,
  recipe: [],
  music_artist: [],
  music_track: ["to_listen", "listened"],
} as const satisfies Record<ItemType, readonly string[]>;

export type MusicTrackStatus = (typeof STATUSES.music_track)[number];
export type ItemStatus = BookStatus | MovieStatus | MusicTrackStatus;

export function statusesFor(type: ItemType): readonly string[] {
  return STATUSES[type];
}

export function defaultStatus(type: ItemType): ItemStatus | null {
  return (STATUSES[type][0] as ItemStatus | undefined) ?? null;
}

export type Ingredient = { quantity: string; name: string };

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  createdAt: string;
  author: string | null;
  status: ItemStatus | null;
  recommendedBy: string | null;
  rating: number | null;
  notes: string | null;
  quantity: string | null;
  checked: boolean;
  ingredients: Ingredient[] | null;
  steps: string[] | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
  isbn: string | null;
  synopsis: string | null;
  genres: string[] | null;
  publicationYear: number | null;
  publisher: string | null;
  pageCount: number | null;
  workId: string | null;
  tags: string[] | null;
  seriesName: string | null;
  seriesPosition: number | null;
  pagesRead: number | null;
  loanedTo: string | null;
  loanedAt: string | null;
  mood: BookMood | null;
  pace: BookPace | null;
  franchiseId: string | null;
  franchiseName: string | null;
  franchiseOrder: number | null;
  watchedAt: string | null;
  episodeProgress: EpisodeProgressMap | null;
  nextEpisodeKey: string | null;
  streamingProviders: StreamingProvider[] | null;
  director: string | null;
  cast: string[] | null;
  imdbId: string | null;
  releaseYear: number | null;
  catalogRating: number | null;
  mediaKind: MediaKind | null;
  artist: string | null;
  album: string | null;
  musicBrainzArtistId: string | null;
  musicBrainzRecordingId: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  cookbookId: string | null;
  sourcePage: string | null;
};

const FIELDS_BY_TYPE: Record<ItemType, readonly (keyof Item)[]> = {
  shopping: ["quantity", "checked"],
  book: BOOK_ITEM_FIELD_KEYS,
  movie: MOVIE_ITEM_FIELD_KEYS,
  recipe: ["notes", "ingredients", "steps", "cookbookId", "sourcePage"],
  music_artist: [
    "recommendedBy",
    "rating",
    "notes",
    "musicBrainzArtistId",
    "spotifyUrl",
    "soundcloudUrl",
  ],
  music_track: [
    "artist",
    "album",
    "releaseYear",
    "status",
    "recommendedBy",
    "rating",
    "notes",
    "musicBrainzRecordingId",
    "spotifyUrl",
    "soundcloudUrl",
  ],
};

const TYPE_SPECIFIC_FIELDS = [
  "author",
  "status",
  "recommendedBy",
  "rating",
  "notes",
  "quantity",
  "ingredients",
  "steps",
  "isbn",
  "synopsis",
  "genres",
  "publicationYear",
  "publisher",
  "pageCount",
  "workId",
  "tags",
  "seriesName",
  "seriesPosition",
  "pagesRead",
  "loanedTo",
  "loanedAt",
  "mood",
  "pace",
  "franchiseId",
  "franchiseName",
  "franchiseOrder",
  "watchedAt",
  "episodeProgress",
  "nextEpisodeKey",
  "streamingProviders",
  "director",
  "cast",
  "imdbId",
  "releaseYear",
  "catalogRating",
  "mediaKind",
  "artist",
  "album",
  "musicBrainzArtistId",
  "musicBrainzRecordingId",
  "spotifyUrl",
  "soundcloudUrl",
  "cookbookId",
  "sourcePage",
] as const satisfies readonly (keyof Item)[];

const timestamp = z.iso.datetime({ offset: true });
const text = z.string().nullable();

const itemShape = {
  id: z.uuid(),
  type: z.enum(ITEM_TYPES),
  title: z.string().trim().min(1),
  createdAt: timestamp,
  status: z.string().nullable(),
  recommendedBy: text,
  rating: z.number().int().min(1).max(5).nullable(),
  notes: text,
  quantity: text,
  checked: z.boolean(),
  ingredients: z.array(z.strictObject({ quantity: z.string(), name: z.string() })).nullable(),
  steps: z.array(z.string()).nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
  tags: z
    .union([z.array(z.string()), z.null()])
    .transform((value) => {
      if (!Array.isArray(value) || value.length === 0) return null;
      const trimmed = value.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
      return trimmed.length === 0 ? null : trimmed;
    }),
  ...bookItemShapeFields,
  ...movieItemShapeFields,
  artist: text,
  album: text,
  musicBrainzArtistId: text,
  musicBrainzRecordingId: text,
  spotifyUrl: text,
  soundcloudUrl: text,
  cookbookId: z.uuid().nullable(),
  sourcePage: z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value === null) return null;
      const trimmed = value.trim();
      if (trimmed === "") return null;
      return trimmed;
    })
    .pipe(z.union([z.null(), z.string().max(100)])),
};

function checkCrossType(value: Item, ctx: z.RefinementCtx, path: (f: string) => string): void {
  const allowed = FIELDS_BY_TYPE[value.type];
  for (const field of TYPE_SPECIFIC_FIELDS) {
    if (!allowed.includes(field) && (value[field] ?? null) !== null) {
      ctx.addIssue({
        code: "custom",
        path: [path(field)],
        message: `${field} must be null for type ${value.type}`,
      });
    }
  }
  if (value.type !== "shopping" && value.checked) {
    ctx.addIssue({
      code: "custom",
      path: [path("checked")],
      message: "checked must be false outside shopping",
    });
  }
  if (value.status !== null && !statusesFor(value.type).includes(value.status)) {
    ctx.addIssue({
      code: "custom",
      path: [path("status")],
      message: `invalid status for type ${value.type}`,
    });
  }

  refineBookItem(value, ctx, path);
  refineMovieItem(value, ctx, path);

  if (
    value.type === "music_artist" &&
    value.musicBrainzArtistId != null &&
    !isValidMusicBrainzId(value.musicBrainzArtistId)
  ) {
    ctx.addIssue({
      code: "custom",
      path: [path("musicBrainzArtistId")],
      message: "invalid MusicBrainz artist id",
    });
  }
  if (
    value.type === "music_track" &&
    value.musicBrainzRecordingId != null &&
    !isValidMusicBrainzId(value.musicBrainzRecordingId)
  ) {
    ctx.addIssue({
      code: "custom",
      path: [path("musicBrainzRecordingId")],
      message: "invalid MusicBrainz recording id",
    });
  }
  if (value.type === "music_track") {
    const artistText = value.artist?.trim() ?? "";
    if (artistText === "") {
      ctx.addIssue({
        code: "custom",
        path: [path("artist")],
        message: "artist is required for music_track",
      });
    }
  }
  for (const urlField of ["spotifyUrl", "soundcloudUrl"] as const) {
    const urlValue = value[urlField];
    if (urlValue != null && urlValue !== "" && !isValidHttpsUrl(urlValue)) {
      ctx.addIssue({
        code: "custom",
        path: [path(urlField)],
        message: `${urlField} must be a valid HTTPS URL`,
      });
    }
  }
  if (value.type === "recipe" && value.cookbookId === null && value.sourcePage !== null) {
    ctx.addIssue({
      code: "custom",
      path: [path("sourcePage")],
      message: "sourcePage requires cookbookId",
    });
  }
}

const itemSchema = z
  .strictObject(itemShape)
  .superRefine((value, ctx) => checkCrossType(value as Item, ctx, (f) => f));

const SNAKE: Partial<Record<keyof Item, string>> = {
  createdAt: "created_at",
  recommendedBy: "recommended_by",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
  publicationYear: "publication_year",
  pageCount: "page_count",
  workId: "work_id",
  seriesName: "series_name",
  seriesPosition: "series_position",
  pagesRead: "pages_read",
  loanedTo: "loaned_to",
  loanedAt: "loaned_at",
  franchiseId: "franchise_id",
  franchiseName: "franchise_name",
  franchiseOrder: "franchise_order",
  watchedAt: "watched_at",
  episodeProgress: "episode_progress",
  nextEpisodeKey: "next_episode_key",
  streamingProviders: "streaming_providers",
  director: "director",
  cast: "cast",
  imdbId: "imdb_id",
  releaseYear: "release_year",
  catalogRating: "catalog_rating",
  mediaKind: "media_kind",
  musicBrainzArtistId: "music_brainz_artist_id",
  musicBrainzRecordingId: "music_brainz_recording_id",
  spotifyUrl: "spotify_url",
  soundcloudUrl: "soundcloud_url",
  cookbookId: "cookbook_id",
  sourcePage: "source_page",
};

const snakeOf = (field: string): string => SNAKE[field as keyof Item] ?? field;

/** Postgres / ItemWire column name for a domain field (library field lists use this). */
export function itemFieldWireName(field: keyof Item): string {
  return snakeOf(field);
}

export const BOOK_LIBRARY_WIRE_COLUMNS = BOOK_ITEM_FIELD_KEYS.map((field) =>
  itemFieldWireName(field),
);

export const MOVIE_LIBRARY_WIRE_COLUMNS = MOVIE_ITEM_FIELD_KEYS.map((field) =>
  itemFieldWireName(field),
);

const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));

const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const itemWireSchema = z
  .strictObject({
    id: itemShape.id,
    type: itemShape.type,
    title: itemShape.title,
    created_at: itemShape.createdAt,
    author: itemShape.author,
    status: itemShape.status,
    recommended_by: itemShape.recommendedBy,
    rating: itemShape.rating,
    notes: itemShape.notes,
    quantity: itemShape.quantity,
    checked: itemShape.checked,
    ingredients: itemShape.ingredients,
    steps: itemShape.steps,
    deleted_at: itemShape.deletedAt,
    fields_updated_at: itemShape.fieldsUpdatedAt,
    isbn: itemShape.isbn.optional(),
    synopsis: itemShape.synopsis.optional(),
    genres: itemShape.genres.optional(),
    publication_year: itemShape.publicationYear.optional(),
    publisher: itemShape.publisher.optional(),
    page_count: itemShape.pageCount.optional(),
    work_id: itemShape.workId.optional(),
    tags: itemShape.tags.optional(),
    series_name: itemShape.seriesName.optional(),
    series_position: itemShape.seriesPosition.optional(),
    pages_read: itemShape.pagesRead.optional(),
    loaned_to: itemShape.loanedTo.optional(),
    loaned_at: itemShape.loanedAt.optional(),
    mood: itemShape.mood.optional(),
    pace: itemShape.pace.optional(),
    franchise_id: itemShape.franchiseId.optional(),
    franchise_name: itemShape.franchiseName.optional(),
    franchise_order: itemShape.franchiseOrder.optional(),
    watched_at: itemShape.watchedAt.optional(),
    episode_progress: itemShape.episodeProgress.optional(),
    next_episode_key: itemShape.nextEpisodeKey.optional(),
    streaming_providers: itemShape.streamingProviders.optional(),
    director: itemShape.director.optional(),
    cast: itemShape.cast.optional(),
    imdb_id: itemShape.imdbId.optional(),
    release_year: itemShape.releaseYear.optional(),
    catalog_rating: itemShape.catalogRating.optional(),
    media_kind: itemShape.mediaKind.optional(),
    artist: itemShape.artist.optional(),
    album: itemShape.album.optional(),
    music_brainz_artist_id: itemShape.musicBrainzArtistId.optional(),
    music_brainz_recording_id: itemShape.musicBrainzRecordingId.optional(),
    spotify_url: itemShape.spotifyUrl.optional(),
    soundcloud_url: itemShape.soundcloudUrl.optional(),
    cookbook_id: itemShape.cookbookId.optional(),
    source_page: itemShape.sourcePage.optional(),
    server_updated_at: timestamp.nullable(),
  })
  .superRefine((wire, ctx) =>
    checkCrossType(
      {
        ...coalesceCatalogWireFields(wire),
        createdAt: wire.created_at,
        recommendedBy: wire.recommended_by,
        deletedAt: wire.deleted_at,
        fieldsUpdatedAt: wire.fields_updated_at,
      } as Item,
      ctx,
      snakeOf,
    ),
  );

export type ItemWire = z.infer<typeof itemWireSchema>;

export type NewItemInput = {
  id: string;
  type: ItemType;
  title: string;
  createdAt: string;
} & Partial<
  Pick<
    Item,
    | "author"
    | "status"
    | "recommendedBy"
    | "rating"
    | "notes"
    | "quantity"
    | "checked"
    | "ingredients"
    | "steps"
    | "isbn"
    | "synopsis"
    | "genres"
    | "publicationYear"
    | "publisher"
    | "pageCount"
    | "workId"
    | "tags"
    | "seriesName"
    | "seriesPosition"
    | "pagesRead"
    | "loanedTo"
    | "loanedAt"
    | "mood"
    | "pace"
    | "franchiseId"
    | "franchiseName"
    | "franchiseOrder"
    | "watchedAt"
    | "episodeProgress"
    | "nextEpisodeKey"
    | "streamingProviders"
    | "director"
    | "cast"
    | "imdbId"
    | "synopsis"
    | "releaseYear"
    | "catalogRating"
    | "mediaKind"
    | "artist"
    | "album"
    | "musicBrainzArtistId"
    | "musicBrainzRecordingId"
    | "spotifyUrl"
    | "soundcloudUrl"
    | "cookbookId"
    | "sourcePage"
  >
>;

export type ItemPatch = Partial<Omit<Item, "id" | "type" | "createdAt">>;

export function newItem(input: NewItemInput): Item {
  const candidate: Item = {
    id: input.id,
    type: input.type,
    title: input.title,
    createdAt: input.createdAt,
    author: input.author ?? null,
    status: input.status ?? defaultStatus(input.type),
    recommendedBy: input.recommendedBy ?? null,
    rating: input.rating ?? null,
    notes: input.notes ?? null,
    quantity: input.quantity ?? null,
    checked: input.checked ?? false,
    ingredients: input.ingredients ?? null,
    steps: input.steps ?? null,
    deletedAt: null,
    fieldsUpdatedAt: {},
    isbn: input.isbn ?? null,
    synopsis: input.synopsis ?? null,
    genres: input.genres ?? null,
    publicationYear: input.publicationYear ?? null,
    publisher: input.publisher ?? null,
    pageCount: input.pageCount ?? null,
    workId: input.workId ?? null,
    tags: input.tags ?? null,
    seriesName: input.seriesName ?? null,
    seriesPosition: input.seriesPosition ?? null,
    pagesRead: input.pagesRead ?? null,
    loanedTo: input.loanedTo ?? null,
    loanedAt: input.loanedAt ?? null,
    mood: input.mood ?? null,
    pace: input.pace ?? null,
    franchiseId: input.franchiseId ?? null,
    franchiseName: input.franchiseName ?? null,
    franchiseOrder: input.franchiseOrder ?? null,
    watchedAt: input.watchedAt ?? null,
    episodeProgress: input.episodeProgress ?? null,
    nextEpisodeKey: input.nextEpisodeKey ?? null,
    streamingProviders: input.streamingProviders ?? null,
    director: input.director ?? null,
    cast: input.cast ?? null,
    imdbId: input.imdbId ?? null,
    releaseYear: input.releaseYear ?? null,
    catalogRating: input.catalogRating ?? null,
    mediaKind: input.mediaKind ?? null,
    artist: input.artist ?? null,
    album: input.album ?? null,
    musicBrainzArtistId: input.musicBrainzArtistId ?? null,
    musicBrainzRecordingId: input.musicBrainzRecordingId ?? null,
    spotifyUrl: input.spotifyUrl ?? null,
    soundcloudUrl: input.soundcloudUrl ?? null,
    cookbookId: input.cookbookId ?? null,
    sourcePage: input.sourcePage ?? null,
  };
  return itemSchema.parse(candidate) as Item;
}

export function updateItem(item: Item, patch: ItemPatch): Item {
  const immutable = ["id", "type", "createdAt"] as const;
  for (const key of immutable) {
    const value = (patch as Record<string, unknown>)[key];
    if (value !== undefined && value !== item[key]) {
      throw new Error(`${key} is immutable`);
    }
  }
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
  const fieldsUpdatedAt = { ...item.fieldsUpdatedAt, ...patch.fieldsUpdatedAt };
  return itemSchema.parse({ ...item, ...defined, fieldsUpdatedAt }) as Item;
}

export function itemToWire(item: Item, serverUpdatedAt: string | null = null): ItemWire {
  const { fieldsUpdatedAt, ...rest } = item;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<ItemWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

function coalesceCatalogWireFields(
  wire: Omit<ItemWire, "fields_updated_at" | "server_updated_at">,
): Record<string, unknown> {
  return {
    ...mapKeys(restWithoutCatalog(wire), camelOf),
    isbn: wire.isbn ?? null,
    synopsis: wire.synopsis ?? null,
    genres: wire.genres ?? null,
    publicationYear: wire.publication_year ?? null,
    publisher: wire.publisher ?? null,
    pageCount: wire.page_count ?? null,
    workId: wire.work_id ?? null,
    tags: wire.tags ?? null,
    seriesName: wire.series_name ?? null,
    seriesPosition: wire.series_position ?? null,
    pagesRead: wire.pages_read ?? null,
    loanedTo: wire.loaned_to ?? null,
    loanedAt: wire.loaned_at ?? null,
    mood: wire.mood ?? null,
    pace: wire.pace ?? null,
    franchiseId: wire.franchise_id ?? null,
    franchiseName: wire.franchise_name ?? null,
    franchiseOrder: wire.franchise_order ?? null,
    watchedAt: wire.watched_at ?? null,
    episodeProgress: wire.episode_progress ?? null,
    nextEpisodeKey: wire.next_episode_key ?? null,
    streamingProviders: wire.streaming_providers ?? null,
    director: wire.director ?? null,
    cast: wire.cast ?? null,
    imdbId: wire.imdb_id ?? null,
    releaseYear: wire.release_year ?? null,
    catalogRating: wire.catalog_rating ?? null,
    mediaKind: wire.media_kind ?? null,
    artist: wire.artist ?? null,
    album: wire.album ?? null,
    musicBrainzArtistId: wire.music_brainz_artist_id ?? null,
    musicBrainzRecordingId: wire.music_brainz_recording_id ?? null,
    spotifyUrl: wire.spotify_url ?? null,
    soundcloudUrl: wire.soundcloud_url ?? null,
    cookbookId: wire.cookbook_id ?? null,
    sourcePage: wire.source_page ?? null,
  };
}

function restWithoutCatalog(
  wire: Omit<ItemWire, "fields_updated_at" | "server_updated_at">,
): Record<string, unknown> {
  const {
    isbn,
    synopsis,
    genres,
    publication_year,
    publisher,
    page_count,
    work_id,
    tags,
    series_name,
    series_position,
    pages_read,
    loaned_to,
    loaned_at,
    mood,
    pace,
    franchise_id,
    franchise_name,
    franchise_order,
    watched_at,
    episode_progress,
    next_episode_key,
    streaming_providers,
    director,
    cast,
    imdb_id,
    release_year,
    catalog_rating,
    media_kind,
    artist,
    album,
    music_brainz_artist_id,
    music_brainz_recording_id,
    spotify_url,
    soundcloud_url,
    ...rest
  } = wire;
  return rest as Record<string, unknown>;
}

export function wireToItem(wire: ItemWire): Item {
  const { fields_updated_at, ...rest } = wire;
  delete (rest as Partial<ItemWire>).server_updated_at;
  return itemSchema.parse({
    ...coalesceCatalogWireFields(rest),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as Item;
}
