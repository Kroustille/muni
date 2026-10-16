import type { BookMood, Item } from "@/domain/item";

export type SuggestBooksOptions = {
  now?: Date;
  random?: () => number;
};

function isReadInLastYear(item: Item, cutoff: Date): boolean {
  if (item.type !== "book" || item.status !== "read") return false;
  const readAt = item.fieldsUpdatedAt.read ?? item.fieldsUpdatedAt.status;
  if (!readAt) return true;
  return new Date(readAt) >= cutoff;
}

function mostRecentReadMood(books: readonly Item[]): BookMood | null {
  const withMood = books.filter(
    (item) => item.type === "book" && item.status === "read" && item.mood !== null,
  );
  withMood.sort((a, b) =>
    (b.fieldsUpdatedAt.read ?? "").localeCompare(a.fieldsUpdatedAt.read ?? ""),
  );
  return withMood[0]?.mood ?? null;
}

function shuffleInPlace<T>(items: T[], random: () => number): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

export function suggestBooks(books: readonly Item[], options: SuggestBooksOptions = {}): Item[] {
  const now = options.now ?? new Date();
  const random = options.random ?? Math.random;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 12);

  const bookItems = books.filter((item) => item.type === "book");
  const recentlyRead = bookItems.filter((item) => isReadInLastYear(item, cutoff));

  const readTags = new Set<string>();
  const readGenres = new Set<string>();
  for (const item of recentlyRead) {
    for (const tag of item.tags ?? []) readTags.add(tag);
    for (const genre of item.genres ?? []) readGenres.add(genre);
  }

  const targetMood = mostRecentReadMood(bookItems);

  const candidates = bookItems.filter(
    (item) => item.status === "to_read" || item.status === null,
  );

  const scored = candidates
    .map((book) => {
      let score = 0;
      for (const tag of book.tags ?? []) {
        if (readTags.has(tag)) score += 1;
      }
      for (const genre of book.genres ?? []) {
        if (readGenres.has(genre)) score += 1;
      }
      if (targetMood !== null && book.mood === targetMood) score += 2;
      return { book, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.book.id.localeCompare(b.book.id);
    });

  const results: Item[] = [];
  let index = 0;
  while (index < scored.length && results.length < 5) {
    const score = scored[index].score;
    const tieGroup: Item[] = [];
    while (index < scored.length && scored[index].score === score) {
      tieGroup.push(scored[index].book);
      index += 1;
    }
    shuffleInPlace(tieGroup, random);
    for (const book of tieGroup) {
      if (results.length < 5) results.push(book);
    }
  }

  return results.length >= 3 ? results : [];
}
