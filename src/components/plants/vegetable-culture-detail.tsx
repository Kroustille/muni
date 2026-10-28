"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCultureUseCases } from "@/composition/client";
import { localCalendarDate } from "@/application/fitness/today";
import type { VegetableCulture } from "@/domain/vegetable-culture";
import type { VegetableMilestoneType } from "@/domain/vegetable-milestone";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { t, type MessageKey } from "@/i18n";

const MILESTONES: { type: VegetableMilestoneType; labelKey: MessageKey }[] = [
  { type: "sow", labelKey: "plants.milestone.sow" },
  { type: "transplant", labelKey: "plants.milestone.transplant" },
  { type: "thin", labelKey: "plants.milestone.thin" },
  { type: "harvest", labelKey: "plants.milestone.harvest" },
];

export type VegetableCultureDetailProps = {
  cultureId: string;
};

export function VegetableCultureDetail({ cultureId }: VegetableCultureDetailProps) {
  const today = localCalendarDate();
  const [culture, setCulture] = useState<VegetableCulture | undefined>();
  const [titleDraft, setTitleDraft] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [variety, setVariety] = useState("");
  const [notes, setNotes] = useState("");
  const [activeMilestone, setActiveMilestone] = useState<VegetableMilestoneType | null>(null);
  const [milestoneDate, setMilestoneDate] = useState(today);
  const [dedupeMessage, setDedupeMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const uc = await getCultureUseCases();
    const loaded = await uc.getCulture(cultureId);
    setCulture(loaded);
    if (loaded !== undefined) {
      setTitleDraft(loaded.title);
      setLocationNote(loaded.locationNote ?? "");
      setVariety(loaded.variety ?? "");
      setNotes(loaded.notes ?? "");
    }
  }, [cultureId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persist = async (
    patch: Partial<Pick<VegetableCulture, "title" | "locationNote" | "variety" | "notes">>,
  ): Promise<void> => {
    if (culture === undefined) return;
    const uc = await getCultureUseCases();
    const next = {
      title: patch.title ?? culture.title,
      locationNote:
        patch.locationNote !== undefined
          ? patch.locationNote === null || patch.locationNote.trim() === ""
            ? null
            : patch.locationNote.trim()
          : culture.locationNote,
      variety:
        patch.variety !== undefined
          ? patch.variety === null || patch.variety.trim() === ""
            ? null
            : patch.variety.trim()
          : culture.variety,
      notes:
        patch.notes !== undefined
          ? patch.notes === null || patch.notes.trim() === ""
            ? null
            : patch.notes.trim()
          : culture.notes,
    };
    const updated = await uc.updateCulture(culture.id, next);
    setCulture(updated);
  };

  const recordMilestone = async (type: VegetableMilestoneType): Promise<void> => {
    if (culture === undefined) return;
    const uc = await getCultureUseCases();
    const result = await uc.recordMilestone({
      cultureId: culture.id,
      milestoneType: type,
      occurredAt: milestoneDate,
    });
    if (result.kind === "deduped") {
      setDedupeMessage(t("plants.dedupe.today"));
      window.setTimeout(() => setDedupeMessage(null), 4000);
    }
    setActiveMilestone(null);
  };

  if (culture === undefined) {
    return (
      <p className="text-muted" data-testid="culture-detail-loading">
        …
      </p>
    );
  }

  if (culture.deletedAt !== null) {
    return (
      <p className="text-muted" data-testid="culture-not-found">
        {t("plants.culture.notFound")}
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="vegetable-culture-detail">
      <Link href="/plants/potager" className="text-sm text-accent">
        ← {t("plants.potager.title")}
      </Link>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">{t("plants.field.title")}</span>
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => void persist({ title: titleDraft })}
          className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-xl font-semibold"
          data-testid="culture-title"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">{t("plants.field.locationNote")}</span>
        <input
          value={locationNote}
          onChange={(e) => setLocationNote(e.target.value)}
          onBlur={() => void persist({ locationNote })}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="culture-location-note"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">{t("plants.field.variety")}</span>
        <input
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          onBlur={() => void persist({ variety })}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="culture-variety"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted">{t("plants.field.notes")}</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void persist({ notes })}
          className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="culture-notes"
        />
      </label>

      <div className="space-y-2" data-testid="culture-milestones">
        <p className="text-sm font-medium">{t("plants.potager.nav")}</p>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((m) => (
            <Button
              key={m.type}
              type="button"
              variant="secondary"
              data-testid={`culture-milestone-${m.type}`}
              onClick={() => {
                setActiveMilestone(m.type);
                setMilestoneDate(today);
              }}
            >
              {t(m.labelKey)}
            </Button>
          ))}
        </div>
        {activeMilestone !== null ? (
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border p-3">
            <input
              type="date"
              max={today}
              value={milestoneDate}
              onChange={(e) => setMilestoneDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              data-testid="culture-milestone-date"
            />
            <Button
              type="button"
              data-testid="culture-milestone-save"
              onClick={() => void recordMilestone(activeMilestone)}
            >
              {t("plants.action.save")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setActiveMilestone(null)}>
              {t("action.cancel")}
            </Button>
          </div>
        ) : null}
      </div>

      {dedupeMessage !== null ? <Toast message={dedupeMessage} /> : null}
    </div>
  );
}
