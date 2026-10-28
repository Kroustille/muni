"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultRecapPeriod, localTodayDateKey } from "@/application/recap/period";
import type { RecapPeriod, RecapSnapshot } from "@/domain/recap";
import { getRecapUseCases } from "@/composition/client-recap";
import { RecapActivityHeatmap } from "@/components/recap/recap-activity-heatmap";
import { RecapDomainSections, RecapEmptyState } from "@/components/recap/recap-domain-sections";
import { RecapPeriodControls } from "@/components/recap/recap-period-controls";
import { useIsMobile } from "@/components/use-is-mobile";
import { t } from "@/i18n";

function periodFromSearchParams(
  params: URLSearchParams,
  timeZone: string,
): RecapPeriod {
  const base = defaultRecapPeriod(timeZone);
  const periodParam = params.get("period");
  const dateParam = params.get("date");
  const granularity =
    periodParam === "month" ||
    periodParam === "day" ||
    periodParam === "year" ||
    periodParam === "week"
      ? periodParam
      : base.granularity;
  const anchorDate =
    dateParam != null && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : localTodayDateKey(timeZone);
  return { granularity, anchorDate, timeZone };
}

export function RecapPage() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<RecapPeriod>(() =>
    periodFromSearchParams(searchParams, defaultRecapPeriod().timeZone),
  );
  const [snapshot, setSnapshot] = useState<RecapSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (activePeriod: RecapPeriod) => {
    const recap = await getRecapUseCases();
    const next = await recap.buildSnapshot(activePeriod);
    setSnapshot(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh(period);
  }, [period, refresh]);

  const showYearMonths = period.granularity === "year";

  const intro = useMemo(() => {
    if (snapshot == null || snapshot.empty) return t("recap.intro");
    return t("recap.intro");
  }, [snapshot]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 pb-20 md:pb-4">
      <h1 className="font-serif text-2xl font-semibold">{t("recap.title")}</h1>
      {!isMobile && snapshot ? <RecapActivityHeatmap days={snapshot.activityDays} /> : null}
      <RecapPeriodControls period={period} onChange={setPeriod} />
      <p className="text-sm text-muted">{intro}</p>
      {loading || snapshot == null ? (
        <p className="text-sm text-muted" aria-busy="true">
          …
        </p>
      ) : snapshot.empty ? (
        <RecapEmptyState />
      ) : (
        <RecapDomainSections sections={snapshot.sections} yearGranularity={showYearMonths} />
      )}
    </main>
  );
}

export function RecapHomeTeaser() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeItems: (() => void) | undefined;

    const load = async () => {
      const recap = await getRecapUseCases();
      const period = defaultRecapPeriod();
      const snapshot = await recap.buildSnapshot(period);
      if (!cancelled) setCount(snapshot.totalCount);
    };

    void load().then(async () => {
      const { getItemUseCases } = await import("@/composition/client");
      const items = await getItemUseCases();
      unsubscribeItems = items.subscribe(() => {
        void load();
      });
    });

    return () => {
      cancelled = true;
      unsubscribeItems?.();
    };
  }, []);

  if (count == null) return null;

  return (
    <section className="mb-4 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-lg font-medium">{t("recap.homeTeaser.title")}</h2>
      {count > 0 ? (
        <p className="mt-1 text-sm text-muted">
          {t("recap.homeTeaser.count").replace("{count}", String(count))}
        </p>
      ) : null}
      <Link href="/recap?period=week" className="mt-2 inline-block text-sm text-accent underline">
        {t("recap.homeTeaser.cta")}
      </Link>
    </section>
  );
}
