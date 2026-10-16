"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  computeStreak,
  countMoviesFinishedInYear,
  heatmapForYear,
} from "@/application/movies/watch-insights";
import { buildMovieYearInReview, computeMovieStats } from "@/application/movies/movie-stats";
import { DEFAULT_WATCH_TIMEZONE } from "@/application/movies/watch-activity";
import { getItemUseCases } from "@/composition/client";
import type { Item } from "@/domain/item";
import { t } from "@/i18n";

export default function MovieInsightsPage() {
  const year = new Date().getFullYear();
  const [movies, setMovies] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const items = await getItemUseCases().then((uc) => uc.listItems("movie"));
    setMovies(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const finished = useMemo(() => countMoviesFinishedInYear(movies, year), [movies, year]);
  const heatmap = useMemo(() => heatmapForYear(movies, year), [movies, year]);
  const activeDays = useMemo(
    () => new Set(heatmap.filter((cell) => cell.active).map((cell) => cell.date)),
    [heatmap],
  );
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_WATCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const streak = computeStreak(activeDays, todayKey);
  const stats = useMemo(() => computeMovieStats(movies, year), [movies, year]);
  const review = useMemo(() => buildMovieYearInReview(movies, year), [movies, year]);

  if (loading) {
    return <main className="p-4 pb-20" aria-busy="true" />;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("movies.insights.stats")}</h1>
        <Link href="/movies" className="text-sm text-accent underline">
          {t("list.movies")}
        </Link>
      </div>

      <p className="text-sm text-muted">{finished} vus en {year}</p>

      {streak > 0 ? (
        <p className="text-sm">{t("movies.insights.streak").replace("{count}", String(streak))}</p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("movies.insights.activity")}</h2>
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(10px,1fr))] gap-1"
          data-testid="watch-heatmap"
        >
          {heatmap.map((cell) => (
            <span
              key={cell.date}
              title={cell.date}
              className={`h-3 w-3 rounded-sm ${cell.active ? "bg-accent" : "bg-surface border border-border"}`}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4" data-testid="movie-stats">
        <h2 className="text-lg font-medium">{t("movies.insights.stats")}</h2>
        <p className="text-sm">Bilan : {review.moviesWatched} titres</p>
        <p className="text-sm">Série max : {review.longestStreak} jours</p>
        {stats.tags[0] ? (
          <p className="text-sm">Tag populaire : {stats.tags[0].label}</p>
        ) : null}
      </section>
    </main>
  );
}
