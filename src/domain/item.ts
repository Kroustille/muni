import { z } from "zod";

import { isValidHttpsUrl } from "./external-url";
import { isValidImdbId } from "./imdb";
import { isValidIsbn } from "./isbn";
import { isValidMusicBrainzId } from "./musicbrainz";

export const MEDIA_KINDS = ["film", "series"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const BOOK_MOODS = [
  "joyeux",
  "melancolique",
  "intense",
  "apaisant",
  "inspirant",
  "sombre",
  "drôle",
  "romantique",
] as const;
export type BookMood = (typeof BOOK_MOODS)[number];

export const BOOK_PACES = ["lent", "modéré", "rapide", "fébrile"] as const;
export type BookPace = (typeof BOOK_PACES)[number];

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
  book: ["to_read", "reading", "read", "paused"],
  movie: ["to_watch", "watched"],
  recipe: [],
  music_artist: [],
  music_track: ["to_listen", "listened"],
} as const satisfies Record<ItemType, readonly string[]>;

export type BookStatus = (typeof STATUSES.book)[number];
export type MovieStatus = (typeof STATUSES.movie)[number];
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
};

const FIELDS_BY_TYPE: Record<ItemType, readonly (keyof Item)[]> = {
  shopping: ["quantity", "checked"],
  book: [
    "author",
    "status",
    "recommendedBy",
    "rating",
    "notes",
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
  ],
  movie: [
    "status",
    "recommendedBy",
    "rating",
    "notes",
    "imdbId",
    "synopsis",
    "releaseYear",
    "catalogRating",
    "mediaKind",
  ],
  recipe: ["notes", "ingredients", "steps"],
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
] as const satisfies readonly (keyof Item)[];

const timestamp = z.iso.datetime({ offset: true });
const text = z.string().nullable();

const itemShape = {
  id: z.uuid(),
  type: z.enum(ITEM_TYPES),
  title: z.string().trim().min(1),
  createdAt: timestamp,
  author: text,
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
  isbn: text,
  synopsis: text,
  genres: z
    .union([z.array(z.string()), z.null()])
    .transform((value) => (Array.isArray(value) && value.length === 0 ? null : value)),
  publicationYear: z.number().int().min(1000).max(2100).nullable(),
  publisher: text,
  pageCount: z.number().int().min(1).nullable(),
  workId: text,
  tags: z
    .union([z.array(z.string()), z.null()])
    .transform((value) => {
      if (!Array.isArray(value) || value.length === 0) return null;
      const trimmed = value.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
      return trimmed.length === 0 ? null : trimmed;
    }),
  seriesName: text,
  seriesPosition: z.number().nullable(),
  pagesRead: z.number().int().min(0).nullable(),
  loanedTo: text,
  loanedAt: text,
  mood: z.enum(BOOK_MOODS).nullable(),
  pace: z.enum(BOOK_PACES).nullable(),
  imdbId: text,
  releaseYear: z.number().int().min(1000).max(2100).nullable(),
  catalogRating: z.number().min(0).max(10).nullable(),
  mediaKind: z.enum(MEDIA_KINDS).nullable(),
  artist: text,
  album: text,
  musicBrainzArtistId: text,
  musicBrainzRecordingId: text,
  spotifyUrl: text,
  soundcloudUrl: text,
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
  if (value.type === "book" && value.isbn != null && !isValidIsbn(value.isbn)) {
    ctx.addIssue({
      code: "custom",
      path: [path("isbn")],
      message: "invalid ISBN",
    });
  }
  if (value.type === "book") {
    const tags = value.tags;
    if (tags != null) {
      if (tags.length > 50) {
        ctx.addIssue({
          code: "custom",
          path: [path("tags")],
          message: "too many tags",
        });
      }
      for (const tag of tags) {
        if (tag.length > 40) {
          ctx.addIssue({
            code: "custom",
            path: [path("tags")],
            message: "tag too long",
          });
          break;
        }
      }
    }
    if (
      value.pagesRead != null &&
      value.pageCount != null &&
      value.pagesRead > value.pageCount
    ) {
      ctx.addIssue({
        code: "custom",
        path: [path("pagesRead")],
        message: "pagesRead cannot exceed pageCount",
      });
    }
    if (value.loanedTo == null && value.loanedAt != null) {
      ctx.addIssue({
        code: "custom",
        path: [path("loanedAt")],
        message: "loanedAt requires loanedTo",
      });
    }
    if (value.loanedAt != null && !/^\d{4}-\d{2}-\d{2}$/.test(value.loanedAt)) {
      ctx.addIssue({
        code: "custom",
        path: [path("loanedAt")],
        message: "loanedAt must be YYYY-MM-DD",
      });
    }
  }
  if (value.type === "movie" && value.imdbId != null && !isValidImdbId(value.imdbId)) {
    ctx.addIssue({
      code: "custom",
      path: [path("imdbId")],
      message: "invalid IMDb id",
    });
  }
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
  imdbId: "imdb_id",
  releaseYear: "release_year",
  catalogRating: "catalog_rating",
  mediaKind: "media_kind",
  musicBrainzArtistId: "music_brainz_artist_id",
  musicBrainzRecordingId: "music_brainz_recording_id",
  spotifyUrl: "spotify_url",
  soundcloudUrl: "soundcloud_url",
};

const snakeOf = (field: string): string => SNAKE[field as keyof Item] ?? field;

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
    | "imdbId"
    | "releaseYear"
    | "catalogRating"
    | "mediaKind"
    | "artist"
    | "album"
    | "musicBrainzArtistId"
    | "musicBrainzRecordingId"
    | "spotifyUrl"
    | "soundcloudUrl"
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
