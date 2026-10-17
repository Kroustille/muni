import { BOOK_MOODS, BOOK_PACES } from "@/domain/item-book";
import { MOVIE_MOODS, MOVIE_PACES } from "@/domain/item-movie";
import { newItem, type Item, type NewItemInput } from "@/domain/item";

let counter = 0;

function nextId(): string {
  counter += 1;
  const hex = counter.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

const DEFAULT_CREATED_AT = "2026-01-01T00:00:00.000Z";

/** Book library item with optional overrides (tags, lend, mood, etc.). */
export function makeBookLibraryItem(overrides: Partial<NewItemInput> = {}): Item {
  return newItem({
    id: nextId(),
    type: "book",
    title: overrides.title ?? `Book ${counter}`,
    createdAt: DEFAULT_CREATED_AT,
    tags: ["fixture"],
    mood: BOOK_MOODS[0],
    pace: BOOK_PACES[0],
    ...overrides,
  });
}

/** Movie library item (film defaults). */
export function makeMovieLibraryItem(overrides: Partial<NewItemInput> = {}): Item {
  return newItem({
    id: nextId(),
    type: "movie",
    title: overrides.title ?? `Film ${counter}`,
    createdAt: DEFAULT_CREATED_AT,
    status: "to_watch",
    tags: ["fixture"],
    mood: MOVIE_MOODS[1],
    pace: MOVIE_PACES[1],
    mediaKind: "film",
    ...overrides,
  });
}

/** Série with episode progress fields for watch-state tests. */
export function makeMovieSeriesItem(overrides: Partial<NewItemInput> = {}): Item {
  return makeMovieLibraryItem({
    title: overrides.title ?? `Série ${counter}`,
    status: "in_progress",
    mediaKind: "series",
    nextEpisodeKey: "S1E1",
    ...overrides,
  });
}
