import { z } from "zod";

import { isValidImdbId } from "./imdb";
import type { Item } from "./item";
import { BOOK_MOODS, BOOK_PACES, type BookMood, type BookPace } from "./item-book";

export const MEDIA_KINDS = ["film", "series"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MOVIE_MOODS = BOOK_MOODS;
export type MovieMood = BookMood;
export const MOVIE_PACES = BOOK_PACES;
export type MoviePace = BookPace;

export const MOVIE_STATUSES = ["to_watch", "in_progress", "paused", "watched"] as const;
export type MovieStatus = (typeof MOVIE_STATUSES)[number];

export type EpisodeProgressEntry = { watchedAt?: string };
export type EpisodeProgressMap = Record<string, EpisodeProgressEntry>;
export type StreamingProvider = { name: string; url?: string };

export const EPISODE_KEY_PATTERN = /^S\d+E\d+$/;

export const MOVIE_ITEM_FIELD_KEYS = [
  "status",
  "recommendedBy",
  "rating",
  "notes",
  "tags",
  "franchiseId",
  "franchiseName",
  "franchiseOrder",
  "watchedAt",
  "episodeProgress",
  "nextEpisodeKey",
  "mood",
  "pace",
  "streamingProviders",
  "director",
  "cast",
  "imdbId",
  "synopsis",
  "releaseYear",
  "catalogRating",
  "mediaKind",
] as const satisfies readonly (keyof Item)[];

const text = z.string().nullable();

export const movieItemShapeFields = {
  franchiseId: text,
  franchiseName: text,
  franchiseOrder: z.number().int().nullable(),
  watchedAt: text,
  episodeProgress: z
    .union([
      z.record(z.string(), z.object({ watchedAt: z.string().optional() })),
      z.null(),
    ])
    .transform((value) => {
      if (value === null || Object.keys(value).length === 0) return null;
      return value;
    }),
  nextEpisodeKey: text,
  streamingProviders: z
    .union([
      z.array(z.strictObject({ name: z.string().trim().min(1), url: z.string().optional() })),
      z.null(),
    ])
    .transform((value) => (Array.isArray(value) && value.length === 0 ? null : value)),
  director: text,
  cast: z
    .union([z.array(z.string()), z.null()])
    .transform((value) => (Array.isArray(value) && value.length === 0 ? null : value)),
  imdbId: text,
  releaseYear: z.number().int().min(1000).max(2100).nullable(),
  catalogRating: z.number().min(0).max(10).nullable(),
  mediaKind: z.enum(MEDIA_KINDS).nullable(),
};

export function refineMovieItem(
  value: Item,
  ctx: z.RefinementCtx,
  path: (field: string) => string,
): void {
  if (value.type !== "movie") return;

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

  if (value.watchedAt != null && !/^\d{4}-\d{2}-\d{2}$/.test(value.watchedAt)) {
    ctx.addIssue({
      code: "custom",
      path: [path("watchedAt")],
      message: "watchedAt must be YYYY-MM-DD",
    });
  }

  if (value.mediaKind === "film" && value.status === "in_progress") {
    ctx.addIssue({
      code: "custom",
      path: [path("status")],
      message: "films cannot use in_progress status",
    });
  }

  if (value.episodeProgress != null && value.mediaKind !== "series") {
    ctx.addIssue({
      code: "custom",
      path: [path("episodeProgress")],
      message: "episodeProgress only allowed for series",
    });
  }

  if (value.episodeProgress) {
    for (const key of Object.keys(value.episodeProgress)) {
      if (!EPISODE_KEY_PATTERN.test(key)) {
        ctx.addIssue({
          code: "custom",
          path: [path("episodeProgress")],
          message: "invalid episode key",
        });
        break;
      }
    }
  }

  if (value.imdbId != null && !isValidImdbId(value.imdbId)) {
    ctx.addIssue({
      code: "custom",
      path: [path("imdbId")],
      message: "invalid IMDb id",
    });
  }
}
