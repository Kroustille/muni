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
import { t, type MessageKey } from "@/i18n";

type RecapPeriodControlsProps = {
  period: RecapPeriod;
  onChange: (next: RecapPeriod) => void;
};

const GRANULARITY_BUTTONS: { granularity: RecapPeriodGranularity; labelKey: MessageKey }[] = [
  { granularity: "week", labelKey: "recap.period.week" },
  { granularity: "month", labelKey: "recap.period.month" },
  { granularity: "year", labelKey: "recap.period.year" },
];

export function RecapPeriodControls({ period, onChange }: RecapPeriodControlsProps) {
  const resolved = resolvePeriodBounds(period);
  const today = localTodayDateKey(period.timeZone);
  const yesterday = addCalendarDays(today, -1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {GRANULARITY_BUTTONS.map(({ granularity, labelKey }) => (
          <Button
            key={granularity}
            type="button"
            variant={period.granularity === granularity ? "primary" : "secondary"}
            onClick={() => onChange(setPeriodGranularity(period.anchorDate, granularity, period.timeZone))}
          >
            {t(labelKey)}
          </Button>
        ))}
        <Button
          type="button"
          variant={period.granularity === "day" && period.anchorDate === today ? "primary" : "secondary"}
          onClick={() => onChange(setPeriodGranularity(today, "day", period.timeZone))}
        >
          {t("recap.period.day")}
        </Button>
        <Button
          type="button"
          variant={
            period.granularity === "day" && period.anchorDate === yesterday ? "primary" : "secondary"
          }
          onClick={() =>
            onChange({ granularity: "day", anchorDate: yesterday, timeZone: period.timeZone })
          }
        >
          {t("recap.period.dayYesterday")}
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          aria-label={t("recap.prev")}
          onClick={() => onChange(navigatePeriod(period, "prev"))}
        >
          ◀
        </Button>
        <p className="text-center text-sm font-medium">{resolved.labelFr}</p>
        <Button
          type="button"
          variant="secondary"
          aria-label={t("recap.next")}
          onClick={() => onChange(navigatePeriod(period, "next"))}
        >
          ▶
        </Button>
      </div>
    </div>
  );
}
