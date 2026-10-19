"use client";

import type { WeekAdherenceView } from "@/domain/fitness/adherence";
import { t } from "@/i18n";

export function WeekAdherenceStrip({ view }: { view: WeekAdherenceView }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-3" data-testid="fitness-week-strip">
      <p className="mb-2 text-sm font-medium">{t("fitness.weekStrip.title")}</p>
      <p className="text-xs text-muted">
        {view.completedCount} fait · {view.skippedCount} passé · {view.plannedCount} prévu
      </p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {view.sessions.map((session) => (
          <li
            key={`${session.calendarDate}-${session.plannedSessionId}`}
            className={`rounded-full px-2 py-0.5 text-xs ${
              session.status === "completed"
                ? "bg-accent/20 text-accent"
                : session.status === "skipped"
                  ? "bg-muted/30 text-muted"
                  : "bg-background"
            }`}
            title={session.title}
          >
            {session.calendarDate.slice(5)} · {session.status === "completed" ? "✓" : session.status === "skipped" ? "—" : "·"}
          </li>
        ))}
      </ul>
    </section>
  );
}
