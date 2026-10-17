"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  computeStreak,
  countBooksFinishedInYear,
  heatmapForYear,
} from "@/application/books/reading-insights";
import { buildYearInReview, computeBookStats } from "@/application/books/book-stats";
import { DEFAULT_READING_TIMEZONE } from "@/application/books/reading-activity";
import { getItemUseCases, getReadingSettingsUseCases } from "@/composition/client";
import type { Item } from "@/domain/item";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

const MONTH_KEYS = [
  "books.insights.month.0",
  "books.insights.month.1",
  "books.insights.month.2",
  "books.insights.month.3",
  "books.insights.month.4",
  "books.insights.month.5",
  "books.insights.month.6",
  "books.insights.month.7",
  "books.insights.month.8",
  "books.insights.month.9",
  "books.insights.month.10",
  "books.insights.month.11",
] as const;

export default function BookInsightsPage() {
  const year = new Date().getFullYear();
  const [books, setBooks] = useState<Item[]>([]);
  const [targetCount, setTargetCount] = useState("12");
  const [savedTarget, setSavedTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [items, settings] = await Promise.all([
      getItemUseCases().then((uc) => uc.listItems("book")),
      getReadingSettingsUseCases().then((uc) => uc.getAnnualGoal(year)),
    ]);
    setBooks(items);
    if (settings) {
      setSavedTarget(settings.targetCount);
      setTargetCount(String(settings.targetCount));
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const finished = useMemo(() => countBooksFinishedInYear(books, year), [books, year]);
  const heatmap = useMemo(() => heatmapForYear(books, year), [books, year]);
  const activeDays = useMemo(
    () => new Set(heatmap.filter((cell) => cell.active).map((cell) => cell.date)),
    [heatmap],
  );
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_READING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const streak = computeStreak(activeDays, todayKey);
  const stats = useMemo(() => computeBookStats(books, year), [books, year]);
  const review = useMemo(() => buildYearInReview(books, year), [books, year]);
  const showYearReview = new Date().getMonth() === 11;

  async function saveGoal() {
    const parsed = Number(targetCount);
    if (!Number.isInteger(parsed) || parsed < 1) return;
    const settings = await getReadingSettingsUseCases();
    await settings.setAnnualGoal(year, parsed);
    setSavedTarget(parsed);
  }

  if (loading) {
    return <main className="p-4 pb-20" aria-busy="true" />;
  }

  const goalTarget = savedTarget ?? (Number(targetCount) || 1);
  const progressLabel = `${finished} / ${goalTarget}`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("books.insights.stats")}</h1>
        <Link href="/lists/books" className="text-sm text-accent underline">
          {t("list.books")}
        </Link>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">{t("books.insights.goal.title")}</h2>
        <TextField
          label={t("books.insights.goal.target")}
          value={targetCount}
          onChange={(event) => setTargetCount(event.target.value)}
          inputMode="numeric"
        />
        <p className="text-sm text-muted">{progressLabel}</p>
        <Button type="button" onClick={() => void saveGoal()}>{t("action.save")}</Button>
      </section>

      {streak > 0 ? (
        <p className="text-sm">{t("books.insights.streak").replace("{count}", String(streak))}</p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("books.insights.activity")}</h2>
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(10px,1fr))] gap-1"
          data-testid="reading-heatmap"
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

      <section className="flex flex-col gap-4" data-testid="book-stats">
        <h2 className="text-lg font-medium">{t("books.insights.stats")}</h2>
        <div>
          <h3 className="text-sm font-medium text-muted">{t("books.insights.byMonth")}</h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {stats.finishedByMonth.map((row, index) => (
                <tr key={row.label}>
                  <td className="py-1">{t(MONTH_KEYS[index])}</td>
                  <td className="py-1 text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <StatsTable title={t("books.insights.table.genres")} rows={stats.genres} />
        <StatsTable title={t("books.insights.table.tags")} rows={stats.tags} />
        <StatsTable title={t("books.insights.table.authors")} rows={stats.authors} />
        <p className="text-sm">
          {t("books.insights.pagesReadTotal").replace("{count}", String(stats.pagesReadTotal))}
        </p>
      </section>

      {showYearReview ? (
        <section
          className="flex flex-col gap-3 rounded-lg border border-border p-4"
          data-testid="year-in-review"
        >
          <h2 className="text-lg font-medium">
            {t("books.insights.yearReview").replace("{year}", String(year))}
          </h2>
          <p className="text-sm">
            {t("books.insights.review.booksRead").replace("{count}", String(review.booksRead))}
          </p>
          <p className="text-sm">
            {t("books.insights.review.pages").replace("{count}", String(review.pagesRead))}
          </p>
          <p className="text-sm">
            {t("books.insights.review.longestStreak").replace(
              "{count}",
              String(review.longestStreak),
            )}
          </p>
          {review.topGenres.length > 0 ? (
            <p className="text-sm">
              {t("books.insights.review.topGenres").replace(
                "{labels}",
                review.topGenres.map((g) => g.label).join(", "),
              )}
            </p>
          ) : null}
          {review.topTags.length > 0 ? (
            <p className="text-sm">
              {t("books.insights.review.topTags").replace(
                "{labels}",
                review.topTags.map((g) => g.label).join(", "),
              )}
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function StatsTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-muted">{title}</h3>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="py-1">{row.label}</td>
              <td className="py-1 text-right">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
