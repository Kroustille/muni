import { z } from "zod";

import { isValidIsbn } from "./isbn";
import type { Item } from "./item";

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

export const BOOK_STATUSES = ["to_read", "reading", "read", "paused"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const BOOK_ITEM_FIELD_KEYS = [
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
] as const satisfies readonly (keyof Item)[];

const text = z.string().nullable();

export const bookItemShapeFields = {
  author: text,
  isbn: text,
  synopsis: text,
  genres: z
    .union([z.array(z.string()), z.null()])
    .transform((value) => (Array.isArray(value) && value.length === 0 ? null : value)),
  publicationYear: z.number().int().min(1000).max(2100).nullable(),
  publisher: text,
  pageCount: z.number().int().min(1).nullable(),
  workId: text,
  seriesName: text,
  seriesPosition: z.number().nullable(),
  pagesRead: z.number().int().min(0).nullable(),
  loanedTo: text,
  loanedAt: text,
  mood: z.enum(BOOK_MOODS).nullable(),
  pace: z.enum(BOOK_PACES).nullable(),
};

export function refineBookItem(
  value: Item,
  ctx: z.RefinementCtx,
  path: (field: string) => string,
): void {
  if (value.type !== "book") return;

  if (value.isbn != null && !isValidIsbn(value.isbn)) {
    ctx.addIssue({
      code: "custom",
      path: [path("isbn")],
      message: "invalid ISBN",
    });
  }

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
