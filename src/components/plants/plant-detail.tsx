"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getPlantUseCases,
  getRecordCareEventUseCases,
  subscribeSyncStatus,
} from "@/composition/client";
import { localCalendarDate } from "@/application/fitness/today";
import type { Plant, PlantLocationTag } from "@/domain/plant";
import { Button } from "@/components/ui/Button";
import { t, type MessageKey } from "@/i18n";
import { PlantCareActions } from "./plant-care-actions";
import { PlantSeasonalHints } from "./plant-seasonal-hints";

const LOCATION_OPTIONS: { value: PlantLocationTag; labelKey: MessageKey }[] = [
  { value: "indoor", labelKey: "plants.location.indoor" },
  { value: "outdoor", labelKey: "plants.location.outdoor" },
  { value: "both", labelKey: "plants.location.both" },
];

function formatLastWatered(date: string | null): string {
  if (date === null) return t("plants.lastWatered.none");
  if (date === localCalendarDate()) return t("plants.lastWatered.today");
  return date;
}

export type PlantDetailProps = {
  plantId: string;
};

export function PlantDetail({ plantId }: PlantDetailProps) {
  const [plant, setPlant] = useState<Plant | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [lastWatered, setLastWatered] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");

  const refresh = useCallback(async () => {
    const plantUc = await getPlantUseCases();
    const careUc = await getRecordCareEventUseCases();
    const loadedPlant = await plantUc.getPlant(plantId);
    setLoaded(true);
    setPlant(loadedPlant);
    if (loadedPlant !== undefined) {
      setTitleDraft(loadedPlant.title);
      setNotesDraft(loadedPlant.notes ?? "");
      const last = await careUc.lastWateredForPlant(plantId);
      setLastWatered(last);
    }
  }, [plantId]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribePlants: (() => void) | undefined;
    let unsubscribeSync: (() => void) | undefined;
    let previousSync: string | undefined;

    void getPlantUseCases().then(async (uc) => {
      if (cancelled) return;
      await refresh();
      unsubscribePlants = uc.subscribe(() => {
        void refresh();
      });
    });

    void subscribeSyncStatus((state) => {
      if (previousSync !== undefined && previousSync !== "idle" && state === "idle") {
        void refresh();
      }
      previousSync = state;
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribeSync = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribePlants?.();
      unsubscribeSync?.();
    };
  }, [refresh]);

  const saveTitle = async (): Promise<void> => {
    if (plant === undefined) return;
    const uc = await getPlantUseCases();
    const updated = await uc.updatePlant(plant.id, { title: titleDraft });
    setPlant(updated);
  };

  const saveNotes = async (): Promise<void> => {
    if (plant === undefined) return;
    const uc = await getPlantUseCases();
    const updated = await uc.updatePlant(plant.id, {
      notes: notesDraft.trim() === "" ? null : notesDraft.trim(),
    });
    setPlant(updated);
  };

  const setLocation = async (locationTag: PlantLocationTag): Promise<void> => {
    if (plant === undefined) return;
    const uc = await getPlantUseCases();
    const updated = await uc.updatePlant(plant.id, { locationTag });
    setPlant(updated);
  };

  const softDelete = async (): Promise<void> => {
    if (plant === undefined) return;
    const uc = await getPlantUseCases();
    await uc.softDeletePlant(plant.id);
    window.location.assign("/plants");
  };

  if (!loaded) {
    return (
      <p className="text-muted" data-testid="plant-detail-loading">
        …
      </p>
    );
  }

  if (plant === undefined) {
    return (
      <p className="text-muted" data-testid="plant-not-found">
        {t("plants.notFound")}
      </p>
    );
  }

  if (plant.deletedAt !== null) {
    return (
      <p className="text-muted" data-testid="plant-not-found">
        {t("plants.notFound")}
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="plant-detail">
      <Link href="/plants" className="text-sm text-accent">
        ← {t("plants.title")}
      </Link>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">{t("plants.field.title")}</span>
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => void saveTitle()}
          className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-xl font-semibold"
          data-testid="plant-title"
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm text-muted">{t("plants.field.location")}</p>
        <div className="flex flex-wrap gap-2" data-testid="plant-location">
          {LOCATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-testid={`plant-location-${opt.value}`}
              aria-pressed={plant.locationTag === opt.value}
              className={`min-h-9 rounded-lg border px-3 text-sm ${
                plant.locationTag === opt.value ? "border-accent bg-accent/10" : "border-border"
              }`}
              onClick={() => void setLocation(opt.value)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">{t("plants.field.notes")}</span>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => void saveNotes()}
          className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="plant-notes"
        />
      </label>

      <p className="text-sm" data-testid="plant-last-watered">
        <span className="text-muted">{t("plants.lastWatered.label")} : </span>
        {formatLastWatered(lastWatered)}
      </p>

      <PlantCareActions plantId={plant.id} onRecorded={() => void refresh()} />
      <PlantSeasonalHints plant={plant} onUpdated={setPlant} />

      <Button type="button" variant="danger" data-testid="plant-delete" onClick={() => void softDelete()}>
        {t("plants.action.delete")}
      </Button>
    </div>
  );
}
