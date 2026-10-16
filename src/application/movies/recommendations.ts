import type { BookMood, Item } from "@/domain/item";

export type SuggestMoviesOptions = {
  now?: Date;
  random?: () => number;
};

function isWatchedInLastYear(item: Item, cutoff: Date): boolean {
  if (item.type !== "movie" || item.status !== "watched") return false;
  const watchedAt = item.fieldsUpdatedAt.watched ?? item.fieldsUpdatedAt.status;
  if (!watchedAt) return true;
  return new Date(watchedAt) >= cutoff;
}

function mostRecentWatchedMood(movies: readonly Item[]): BookMood | null {
  const withMood = movies.filter(
    (item) => item.type === "movie" && item.status === "watched" && item.mood !== null,
  );
  withMood.sort((a, b) =>
    (b.fieldsUpdatedAt.watched ?? "").localeCompare(a.fieldsUpdatedAt.watched ?? ""),
  );
  return withMood[0]?.mood ?? null;
}

function shuffleInPlace<T>(items: T[], random: () => number): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

export function suggestMovies(movies: readonly Item[], options: SuggestMoviesOptions = {}): Item[] {
  const now = options.now ?? new Date();
  const random = options.random ?? Math.random;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 12);

  const movieItems = movies.filter((item) => item.type === "movie");
  const recentlyWatched = movieItems.filter((item) => isWatchedInLastYear(item, cutoff));

  const watchedTags = new Set<string>();
  const watchedFranchises = new Set<string>();
  for (const item of recentlyWatched) {
    for (const tag of item.tags ?? []) watchedTags.add(tag);
    if (item.franchiseName) watchedFranchises.add(item.franchiseName);
  }

  const targetMood = mostRecentWatchedMood(movieItems);

  const candidates = movieItems.filter(
    (item) => item.status === "to_watch" || item.status === null,
  );

  const scored = candidates
    .map((movie) => {
      let score = 0;
      for (const tag of movie.tags ?? []) {
        if (watchedTags.has(tag)) score += 1;
      }
      if (movie.franchiseName && watchedFranchises.has(movie.franchiseName)) score += 2;
      if (targetMood !== null && movie.mood === targetMood) score += 1;
      return { movie, score };
    })
    .filter(({ score }) => score > 0);

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 12).map(({ movie }) => movie);
  shuffleInPlace(top, random);
  return top.slice(0, 6);
}
