"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  computeStreak,
  countBooksFinishedInYear,
  heatmapForYear,
} from "@/application/books/reading-insights";
import { DEFAULT_READING_TIMEZONE } from "@/application/books/reading-activity";
import { getItemUseCases, getReadingSettingsUseCases } from "@/composition/client";
import type { Item } from "@/domain/item";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

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

    </main>
  );
}
