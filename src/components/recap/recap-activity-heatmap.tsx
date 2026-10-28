"use client";

import { useMemo } from "react";
import type { RecapActivityDay, RecapDomainId } from "@/domain/recap";
import { RECAP_DOMAIN_ACCENTS, heatmapSegmentStyles } from "@/components/recap/recap-domain-accents";
import { buildRecapHeatmapWeekColumns } from "@/components/recap/recap-heatmap-week-columns";
import { RECAP_DOMAIN_IDS } from "@/domain/recap";
import { t, type MessageKey } from "@/i18n";

const DOMAIN_LABEL: Record<RecapDomainId, MessageKey> = {
  book: "recap.section.book",
  movie: "recap.section.movie",
  music_track: "recap.section.music_track",
  recipe: "recap.section.recipe",
  fitness: "recap.section.fitness",
  plants: "recap.section.plants",
};

function formatDayFr(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

type RecapActivityHeatmapProps = {
  days: RecapActivityDay[];
};

export function RecapActivityHeatmap({ days }: RecapActivityHeatmapProps) {
  const weekColumns = useMemo(() => buildRecapHeatmapWeekColumns(days), [days]);

  return (
    <section className="flex flex-col gap-3" aria-label={t("recap.heatmap.title")}>
      <h2 className="text-lg font-medium">{t("recap.heatmap.title")}</h2>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
        <div
          className="inline-flex gap-1"
          data-testid="recap-activity-heatmap"
          role="group"
          aria-label={t("recap.heatmap.title")}
        >
          {weekColumns.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, rowIndex) =>
                day ? (
                  <HeatmapCell key={day.calendarDate} day={day} />
                ) : (
                  <span
                    key={`pad-${weekIndex}-${rowIndex}`}
                    className="h-3 w-3 shrink-0 rounded-sm"
                    aria-hidden
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        className="flex flex-wrap gap-3 text-xs text-muted"
        data-testid="recap-activity-heatmap-legend"
      >
        <span className="font-medium text-foreground">{t("recap.heatmap.legend")}</span>
        {RECAP_DOMAIN_IDS.map((domainId) => (
          <span key={domainId} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: RECAP_DOMAIN_ACCENTS[domainId] }}
              aria-hidden
            />
            {t(DOMAIN_LABEL[domainId])}
          </span>
        ))}
      </div>
    </section>
  );
}

function HeatmapCell({ day }: { day: RecapActivityDay }) {
  const testId = `recap-activity-day-${day.calendarDate}`;
  if (!day.isActive) {
    return (
      <span
        data-testid={testId}
        className="h-3 w-3 shrink-0 rounded-sm border border-border bg-muted/40"
        title={day.calendarDate}
      />
    );
  }

  const domainLabels = day.domainsPresent.map((id) => t(DOMAIN_LABEL[id])).join(", ");
  const ariaLabel = t("recap.heatmap.a11yDay")
    .replace("{date}", formatDayFr(day.calendarDate))
    .replace("{domains}", domainLabels);
  const segments = heatmapSegmentStyles(day.domainsPresent);

  if (segments.length === 1) {
    return (
      <span
        data-testid={testId}
        className="h-3 w-3 shrink-0 rounded-sm"
        style={{ backgroundColor: segments[0].color }}
        title={`${day.calendarDate} — ${domainLabels}`}
        aria-label={ariaLabel}
        role="img"
      />
    );
  }

  return (
    <span
      data-testid={testId}
      className="flex h-3 w-3 shrink-0 overflow-hidden rounded-sm border border-border"
      title={`${day.calendarDate} — ${domainLabels}`}
      aria-label={ariaLabel}
      role="img"
    >
      {segments.map((segment) => (
        <span
          key={segment.domainId}
          className="h-full min-w-0 flex-1"
          style={{ backgroundColor: segment.color, flex: segment.flex }}
        />
      ))}
    </span>
  );
}
