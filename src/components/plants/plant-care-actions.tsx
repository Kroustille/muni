"use client";

import { useState } from "react";
import {
  getRecordCareEventUseCases,
} from "@/composition/client";
import { localCalendarDate } from "@/application/fitness/today";
import type { PlantCareEventType } from "@/domain/plant-care-event";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { t, type MessageKey } from "@/i18n";

const CARE_MENU_TYPES: PlantCareEventType[] = ["fertilize", "repot", "prune", "mist", "other"];

const CARE_LABEL_KEY: Record<PlantCareEventType, MessageKey> = {
  water: "plants.care.water",
  fertilize: "plants.care.fertilize",
  repot: "plants.care.repot",
  prune: "plants.care.prune",
  mist: "plants.care.mist",
  other: "plants.care.other",
};

export type PlantCareActionsProps = {
  plantId: string;
  onRecorded?: () => void;
};

export function PlantCareActions({ plantId, onRecorded }: PlantCareActionsProps) {
  const today = localCalendarDate();
  const [waterDate, setWaterDate] = useState(today);
  const [menuOpen, setMenuOpen] = useState(false);
  const [careType, setCareType] = useState<PlantCareEventType>("fertilize");
  const [careDate, setCareDate] = useState(today);
  const [careNotes, setCareNotes] = useState("");
  const [dedupeMessage, setDedupeMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showDedupe = (): void => {
    setDedupeMessage(t("plants.dedupe.today"));
    window.setTimeout(() => setDedupeMessage(null), 4000);
  };

  const recordWater = async (): Promise<void> => {
    setBusy(true);
    try {
      const uc = await getRecordCareEventUseCases();
      const result = await uc.recordPlantWatered(plantId, waterDate);
      if (result.kind === "deduped") showDedupe();
      else onRecorded?.();
    } finally {
      setBusy(false);
    }
  };

  const recordOtherCare = async (): Promise<void> => {
    setBusy(true);
    try {
      const uc = await getRecordCareEventUseCases();
      await uc.recordCareEvent({
        plantId,
        eventType: careType,
        occurredAt: careDate,
        notes: careNotes.trim() === "" ? null : careNotes.trim(),
      });
      setMenuOpen(false);
      setCareNotes("");
      onRecorded?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="plant-care-actions">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t("plants.care.date")}</span>
          <input
            type="date"
            max={today}
            value={waterDate}
            onChange={(e) => setWaterDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="plant-water-date"
          />
        </label>
        <Button
          type="button"
          disabled={busy}
          data-testid="plant-water-button"
          onClick={() => void recordWater()}
        >
          {t("plants.care.water")}
        </Button>
      </div>

      <div className="relative">
        <Button
          type="button"
          variant="secondary"
          data-testid="plant-care-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {t("plants.care.menu")}
        </Button>
        {menuOpen ? (
          <div
            className="mt-2 space-y-3 rounded-xl border border-border bg-surface p-3"
            data-testid="plant-care-menu"
          >
            <div className="flex flex-wrap gap-2">
              {CARE_MENU_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  data-testid={`plant-care-type-${type}`}
                  className={`min-h-9 rounded-lg border px-3 text-sm ${
                    careType === type ? "border-accent bg-accent/10" : "border-border"
                  }`}
                  onClick={() => setCareType(type)}
                >
                  {t(CARE_LABEL_KEY[type])}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">{t("plants.care.date")}</span>
              <input
                type="date"
                max={today}
                value={careDate}
                onChange={(e) => setCareDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                data-testid="plant-care-date"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">{t("plants.care.notes")}</span>
              <textarea
                value={careNotes}
                onChange={(e) => setCareNotes(e.target.value)}
                className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                data-testid="plant-care-notes"
              />
            </label>
            <Button
              type="button"
              disabled={busy}
              data-testid="plant-care-save"
              onClick={() => void recordOtherCare()}
            >
              {t("plants.care.save")}
            </Button>
          </div>
        ) : null}
      </div>

      {dedupeMessage !== null ? <Toast message={dedupeMessage} /> : null}
    </div>
  );
}
