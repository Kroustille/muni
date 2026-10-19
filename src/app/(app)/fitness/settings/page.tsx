"use client";

import { useEffect, useState } from "react";
import { openMuniDb } from "@/adapters/indexeddb/db";
import { createIndexedDbFitnessSettingsRepository } from "@/adapters/indexeddb/fitness-settings-repository";
import { MUNI_DB_NAME } from "@/composition/client";
import { defaultFitnessUserSettings, type FitnessUserSettings } from "@/domain/fitness/workout-log";
import { t } from "@/i18n";

export default function FitnessSettingsPage() {
  const [settings, setSettings] = useState<FitnessUserSettings>(defaultFitnessUserSettings());

  useEffect(() => {
    void openMuniDb(MUNI_DB_NAME).then(async (db) => {
      const repo = createIndexedDbFitnessSettingsRepository(db);
      const row = await repo.get();
      if (row) setSettings(row);
    });
  }, []);

  const save = async () => {
    const db = await openMuniDb(MUNI_DB_NAME);
    const repo = createIndexedDbFitnessSettingsRepository(db);
    await repo.upsert(settings);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4" data-testid="fitness-settings">
      <h1 className="font-serif text-2xl font-semibold">{t("fitness.settings.title")}</h1>
      <label className="block text-sm">
        {t("fitness.settings.chargeUnit")}
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={settings.chargeUnit}
          onChange={(e) =>
            setSettings({ ...settings, chargeUnit: e.target.value as FitnessUserSettings["chargeUnit"] })
          }
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.adherenceTrackingEnabled}
          onChange={(e) => setSettings({ ...settings, adherenceTrackingEnabled: e.target.checked })}
          data-testid="fitness-adherence-toggle"
        />
        {t("fitness.settings.adherence")}
      </label>
      <button type="button" className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground" onClick={save}>
        {t("fitness.action.save")}
      </button>
    </div>
  );
}
