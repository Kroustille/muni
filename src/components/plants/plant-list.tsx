"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCultureUseCases,
  getPlantUseCases,
  getRecordCareEventUseCases,
  subscribeSyncStatus,
} from "@/composition/client";
import { localCalendarDate } from "@/application/fitness/today";
import type { Plant } from "@/domain/plant";
import type { VegetableCulture } from "@/domain/vegetable-culture";
import { Button } from "@/components/ui/Button";
import { t } from "@/i18n";
import {
  PlantListFilters,
  plantMatchesFilter,
  type PlantListFilterValue,
} from "./plant-list-filters";

function formatLastWatered(date: string | null): string {
  if (date === null) return t("plants.lastWatered.none");
  if (date === localCalendarDate()) return t("plants.lastWatered.today");
  return date;
}

export function PlantList() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [cultures, setCultures] = useState<VegetableCulture[]>([]);
  const [lastWateredByPlant, setLastWateredByPlant] = useState<Record<string, string | null>>({});
  const [filter, setFilter] = useState<PlantListFilterValue>("all");
  const [quickAdd, setQuickAdd] = useState("");
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    const plantUc = await getPlantUseCases();
    const careUc = await getRecordCareEventUseCases();
    const cultureUc = await getCultureUseCases();
    const [allPlants, allCultures] = await Promise.all([
      plantUc.listPlants(),
      cultureUc.listCultures(),
    ]);
    setPlants(allPlants);
    setCultures(allCultures);
    const watered: Record<string, string | null> = {};
    await Promise.all(
      allPlants.map(async (plant) => {
        watered[plant.id] = await careUc.lastWateredForPlant(plant.id);
      }),
    );
    setLastWateredByPlant(watered);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribePlants: (() => void) | undefined;
    let unsubscribeSync: (() => void) | undefined;
    let previousSync: string | undefined;

    void getPlantUseCases().then(async (uc) => {
      refreshRef.current = refresh;
      await refresh();
      if (cancelled) return;
      unsubscribePlants = uc.subscribe(() => {
        void refresh();
      });
    });

    void subscribeSyncStatus((state) => {
      if (previousSync !== undefined && previousSync !== "idle" && state === "idle") {
        void refreshRef.current?.();
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
      refreshRef.current = null;
    };
  }, [refresh]);

  const filteredPlants = useMemo(
    () => plants.filter((p) => plantMatchesFilter(p.locationTag, filter)),
    [plants, filter],
  );

  const showCultures = filter === "potager";

  const onQuickAdd = async (): Promise<void> => {
    const title = quickAdd.trim();
    if (title.length === 0) return;
    const uc = await getPlantUseCases();
    await uc.createPlant({ title });
    setQuickAdd("");
  };

  const empty =
    filter === "potager"
      ? filteredPlants.length === 0 && cultures.length === 0
      : filteredPlants.length === 0;

  return (
    <div className="space-y-4" data-testid="plant-list">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-semibold">{t("plants.title")}</h1>
        <Link href="/plants/potager" className="text-sm text-accent" data-testid="plants-potager-link">
          {t("plants.potager.link")}
        </Link>
      </div>

      <PlantListFilters value={filter} onChange={setFilter} />

      {empty ? (
        <p className="py-8 text-center text-muted" data-testid="plant-list-empty">
          {filter === "potager" ? t("plants.potager.empty") : t("plants.list.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredPlants.map((plant) => (
            <li key={plant.id}>
              <Link
                href={`/plants/${plant.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-3"
                data-testid={`plant-row-${plant.id}`}
              >
                <span className="font-medium">{plant.title}</span>
                <span className="text-sm text-muted" data-testid={`plant-row-watered-${plant.id}`}>
                  {t("plants.lastWatered.label")} : {formatLastWatered(lastWateredByPlant[plant.id] ?? null)}
                </span>
              </Link>
            </li>
          ))}
          {showCultures
            ? cultures.map((culture) => (
                <li key={culture.id}>
                  <Link
                    href={`/plants/potager/${culture.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-3"
                    data-testid={`culture-row-${culture.id}`}
                  >
                    <span className="font-medium">{culture.title}</span>
                    {culture.locationNote ? (
                      <span className="text-sm text-muted">{culture.locationNote}</span>
                    ) : null}
                  </Link>
                </li>
              ))
            : null}
        </ul>
      )}

      <form
        className="flex gap-2 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onQuickAdd();
        }}
        data-testid="plant-quick-add"
      >
        <input
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          placeholder={t("plants.quickAdd.placeholder")}
          className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
          data-testid="plant-quick-add-input"
        />
        <Button type="submit" data-testid="plant-quick-add-submit">
          {t("plants.quickAdd.submit")}
        </Button>
      </form>
    </div>
  );
}
