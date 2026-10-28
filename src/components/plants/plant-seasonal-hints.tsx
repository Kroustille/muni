"use client";

import { useCallback, useState } from "react";
import {
  getPlantUseCases,
  getRecordCareEventUseCases,
} from "@/composition/client";
import { localCalendarDate } from "@/application/fitness/today";
import type { Plant, PlantSeasonKey, PlantSeasonalHint } from "@/domain/plant";
import { validateSeasonalHint } from "@/domain/plant";
import { Button } from "@/components/ui/Button";
import { t, type MessageKey } from "@/i18n";
import { PlantCareActions } from "./plant-care-actions";

const SEASON_OPTIONS: { key: PlantSeasonKey; labelKey: MessageKey }[] = [
  { key: "winter", labelKey: "plants.seasonal.season.winter" },
  { key: "spring", labelKey: "plants.seasonal.season.spring" },
  { key: "summer", labelKey: "plants.seasonal.season.summer" },
  { key: "autumn", labelKey: "plants.seasonal.season.autumn" },
];

export type PlantSeasonalHintsProps = {
  plant: Plant;
  onUpdated: (plant: Plant) => void;
};

export function PlantSeasonalHints({ plant, onUpdated }: PlantSeasonalHintsProps) {
  const today = localCalendarDate();
  const [actionText, setActionText] = useState("");
  const [monthRangeText, setMonthRangeText] = useState("");
  const [seasonKey, setSeasonKey] = useState<PlantSeasonKey | "">("");
  const [doneHintId, setDoneHintId] = useState<string | null>(null);
  const [doneDate, setDoneDate] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const saveHints = async (hints: PlantSeasonalHint[]): Promise<void> => {
    const uc = await getPlantUseCases();
    const updated = await uc.updatePlant(plant.id, { seasonalHints: hints });
    onUpdated(updated);
  };

  const addHint = async (): Promise<void> => {
    setError(null);
    const hint: PlantSeasonalHint = {
      id: crypto.randomUUID(),
      seasonKey: seasonKey === "" ? null : seasonKey,
      monthRangeText: monthRangeText.trim() === "" ? null : monthRangeText.trim(),
      actionText: actionText.trim(),
      sortOrder: plant.seasonalHints.length,
    };
    const err = validateSeasonalHint(hint);
    if (err !== null) {
      setError(err);
      return;
    }
    await saveHints([...plant.seasonalHints, hint]);
    setActionText("");
    setMonthRangeText("");
    setSeasonKey("");
  };

  const markDone = async (hintId: string): Promise<void> => {
    const uc = await getRecordCareEventUseCases();
    await uc.recordCareEvent({
      plantId: plant.id,
      eventType: "other",
      occurredAt: doneDate,
      seasonalHintId: hintId,
    });
    setDoneHintId(null);
  };

  const grouped = useCallback(() => {
    const bySeason = new Map<string, PlantSeasonalHint[]>();
    for (const hint of plant.seasonalHints) {
      const label =
        hint.seasonKey !== null
          ? t(`plants.seasonal.season.${hint.seasonKey}` as MessageKey)
          : t("plants.seasonal.otherPeriod");
      const list = bySeason.get(label) ?? [];
      list.push(hint);
      bySeason.set(label, list);
    }
    return [...bySeason.entries()];
  }, [plant.seasonalHints]);

  return (
    <section className="space-y-3 border-t border-border pt-4" data-testid="plant-seasonal-hints">
      <h2 className="font-serif text-lg font-semibold">{t("plants.seasonal.title")}</h2>
      {plant.seasonalHints.length === 0 ? (
        <p className="text-sm text-muted">{t("plants.seasonal.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {grouped().map(([label, hints]) => (
            <li key={label}>
              <p className="text-sm font-medium text-muted">{label}</p>
              <ul className="mt-1 space-y-2">
                {hints.map((hint) => (
                  <li
                    key={hint.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    data-testid={`plant-seasonal-hint-${hint.id}`}
                  >
                    <div className="min-w-0 text-sm">
                      <p>{hint.actionText}</p>
                      {hint.monthRangeText ? (
                        <p className="text-muted">{hint.monthRangeText}</p>
                      ) : null}
                    </div>
                    {doneHintId === hint.id ? (
                      <div className="flex flex-wrap items-end gap-2">
                        <input
                          type="date"
                          max={today}
                          value={doneDate}
                          onChange={(e) => setDoneDate(e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                          data-testid="plant-seasonal-done-date"
                        />
                        <Button
                          type="button"
                          data-testid="plant-seasonal-done-save"
                          onClick={() => void markDone(hint.id)}
                        >
                          {t("plants.seasonal.done")}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setDoneHintId(null)}>
                          {t("action.cancel")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        data-testid={`plant-seasonal-done-${hint.id}`}
                        onClick={() => {
                          setDoneHintId(hint.id);
                          setDoneDate(today);
                        }}
                      >
                        {t("plants.seasonal.done")}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
        <p className="text-sm font-medium">{t("plants.seasonal.add")}</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("plants.seasonal.season")}</span>
          <select
            value={seasonKey}
            onChange={(e) => setSeasonKey(e.target.value as PlantSeasonKey | "")}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="plant-seasonal-season"
          >
            <option value="">{t("plants.seasonal.otherPeriod")}</option>
            {SEASON_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("plants.seasonal.period")}</span>
          <input
            value={monthRangeText}
            onChange={(e) => setMonthRangeText(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="plant-seasonal-period"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("plants.seasonal.action")}</span>
          <input
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="plant-seasonal-action"
          />
        </label>
        {error !== null ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="button" data-testid="plant-seasonal-add" onClick={() => void addHint()}>
          {t("plants.seasonal.add")}
        </Button>
      </div>
    </section>
  );
}
