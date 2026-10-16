"use client";

import { suggestMovies } from "@/application/movies/recommendations";
import type { Item } from "@/domain/item";
import { t } from "@/i18n";

export type MovieRecommendationsProps = {
  libraryMovies: readonly Item[];
  onSelect?: (id: string) => void;
};

export function MovieRecommendations({ libraryMovies, onSelect }: MovieRecommendationsProps) {
  const suggestions = suggestMovies(libraryMovies);
  if (suggestions.length < 3) return null;

  return (
    <section className="mb-6 rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-lg">{t("movies.discovery.recommendations")}</h2>
      <ul className="flex flex-col gap-2">
        {suggestions.map((movie) => (
          <li key={movie.id}>
            <button
              type="button"
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted/40"
              onClick={() => onSelect?.(movie.id)}
            >
              <span className="font-medium">{movie.title}</span>
              {movie.recommendedBy ? (
                <span className="block text-muted">{movie.recommendedBy}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
