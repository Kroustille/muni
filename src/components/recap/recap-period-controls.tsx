"use client";

import type { RecapPeriod, RecapPeriodGranularity } from "@/domain/recap";
import {
  addCalendarDays,
  localTodayDateKey,
  navigatePeriod,
  resolvePeriodBounds,
  setPeriodGranularity,
} from "@/application/recap/period";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { t, type MessageKey } from "@/i18n";

type RecapPeriodControlsProps = {
  period: RecapPeriod;
  onChange: (next: RecapPeriod) => void;
};

const GRANULARITY_OPTIONS: { granularity: RecapPeriodGranularity; labelKey: MessageKey }[] = [
  { granularity: "day", labelKey: "recap.period.granularity.day" },
  { granularity: "week", labelKey: "recap.period.granularity.week" },
  { granularity: "month", labelKey: "recap.period.granularity.month" },
  { granularity: "year", labelKey: "recap.period.granularity.year" },
];

export function RecapPeriodControls({ period, onChange }: RecapPeriodControlsProps) {
  const resolved = resolvePeriodBounds(period);
  const today = localTodayDateKey(period.timeZone);
  const yesterday = addCalendarDays(today, -1);
  const showDayShortcuts = period.granularity === "day";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          className="max-w-xs min-w-[10rem]"
          label={t("recap.period.granularity.label")}
          data-testid="recap-period-granularity-select"
          value={period.granularity}
          onChange={(event) =>
            onChange(
              setPeriodGranularity(period.anchorDate, event.target.value as RecapPeriodGranularity, period.timeZone),
            )
          }
          options={GRANULARITY_OPTIONS.map(({ granularity, labelKey }) => ({
            value: granularity,
            label: t(labelKey),
          }))}
        />
        {showDayShortcuts ? (
          <>
            <Button
              type="button"
              variant={period.anchorDate === today ? "primary" : "secondary"}
              data-testid="recap-period-day-today"
              onClick={() => onChange(setPeriodGranularity(today, "day", period.timeZone))}
            >
              {t("recap.period.dayToday")}
            </Button>
            <Button
              type="button"
              variant={period.anchorDate === yesterday ? "primary" : "secondary"}
              data-testid="recap-period-day-yesterday"
              onClick={() =>
                onChange({ granularity: "day", anchorDate: yesterday, timeZone: period.timeZone })
              }
            >
              {t("recap.period.dayYesterday")}
            </Button>
          </>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          aria-label={t("recap.prev")}
          data-testid="recap-period-prev"
          onClick={() => onChange(navigatePeriod(period, "prev"))}
        >
          ◀
        </Button>
        <p className="text-center text-sm font-medium">{resolved.labelFr}</p>
        <Button
          type="button"
          variant="secondary"
          aria-label={t("recap.next")}
          data-testid="recap-period-next"
          onClick={() => onChange(navigatePeriod(period, "next"))}
        >
          ▶
        </Button>
      </div>
    </div>
  );
}
