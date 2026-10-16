"use client";

import { useEffect, useRef, useState } from "react";

import {
  cancelScheduledReminder,
  readReleaseReminderPrefs,
  requestNotificationPermission,
  scheduleReleaseReminder,
  writeReleaseReminderPrefs,
} from "@/application/movies/release-reminders";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

export type MovieReleaseReminderProps = {
  movieItemId: string;
  title: string;
};

export function MovieReleaseReminder({ movieItemId, title }: MovieReleaseReminderProps) {
  const [enabled, setEnabled] = useState(false);
  const [airDate, setAirDate] = useState("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const prefs = readReleaseReminderPrefs(movieItemId);
    setEnabled(prefs.enabled);
    setAirDate(prefs.airDate ?? "");
  }, [movieItemId]);

  useEffect(() => {
    cancelScheduledReminder(timeoutRef.current);
    timeoutRef.current = null;
    if (!enabled || airDate.trim() === "") return;
    timeoutRef.current = scheduleReleaseReminder(movieItemId, title, airDate.trim());
    return () => cancelScheduledReminder(timeoutRef.current);
  }, [airDate, enabled, movieItemId, title]);

  const onToggle = async (next: boolean) => {
    if (next) {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        setEnabled(false);
        writeReleaseReminderPrefs(movieItemId, { enabled: false, airDate: airDate.trim() || null });
        return;
      }
    }
    setEnabled(next);
    writeReleaseReminderPrefs(movieItemId, {
      enabled: next,
      airDate: airDate.trim() === "" ? null : airDate.trim(),
    });
  };

  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => void onToggle(event.target.checked)}
        />
        {t("movies.reminder.enable")}
      </label>
      <TextField
        label={t("movies.reminder.airDate")}
        type="date"
        value={airDate}
        onChange={(event) => {
          const value = event.target.value;
          setAirDate(value);
          writeReleaseReminderPrefs(movieItemId, {
            enabled,
            airDate: value.trim() === "" ? null : value.trim(),
          });
        }}
        autoComplete="off"
      />
      <p className="text-xs text-muted">{t("movies.reminder.hint")}</p>
    </section>
  );
}
