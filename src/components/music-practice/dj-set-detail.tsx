"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDjSetUseCases, getItemUseCases } from "@/composition/client";
import type { Item } from "@/domain/item";
import type { DjSet, DjSetStatus, SetlistLine } from "@/domain/dj-set";
import { djSetStatusLabel } from "@/components/music-practice/status-labels";
import { t } from "@/i18n";
import { formatTrackLabel, TrackLinkPicker } from "@/components/music-practice/track-link-picker";

function statusLabel(status: DjSetStatus): string {
  return djSetStatusLabel(status);
}

export function DjSetDetail({ id }: { id: string }) {
  const [djSet, setDjSet] = useState<DjSet | undefined>();
  const [tracks, setTracks] = useState<Item[]>([]);
  const [performedAt, setPerformedAt] = useState("");
  const [lineText, setLineText] = useState("");
  const [linkLineIndex, setLinkLineIndex] = useState<number | null>(null);

  const refresh = async () => {
    const uc = await getDjSetUseCases();
    const row = await uc.getDjSet(id);
    setDjSet(row);
    if (row?.performedAt) setPerformedAt(row.performedAt);
    const items = await getItemUseCases();
    setTracks(await items.listItems("music_track"));
  };

  useEffect(() => {
    void refresh();
  }, [id]);

  if (djSet === undefined) return <p className="text-sm text-muted">…</p>;

  const deleted = djSet.deletedAt !== null;

  const persistSetlist = async (setlist: SetlistLine[]) => {
    const uc = await getDjSetUseCases();
    const next = await uc.updateDjSet(id, { setlist });
    setDjSet(next);
  };

  const addLine = async () => {
    const text = lineText.trim();
    if (!text) return;
    const setlist = [...djSet.setlist, { sortOrder: djSet.setlist.length, text }];
    setLineText("");
    await persistSetlist(setlist);
  };

  const moveLine = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= djSet.setlist.length) return;
    const setlist = [...djSet.setlist];
    const tmp = setlist[index];
    setlist[index] = setlist[target];
    setlist[target] = tmp;
    await persistSetlist(setlist.map((line, sortOrder) => ({ ...line, sortOrder })));
  };

  const removeLine = async (index: number) => {
    const setlist = djSet.setlist.filter((_, i) => i !== index).map((line, sortOrder) => ({ ...line, sortOrder }));
    await persistSetlist(setlist);
  };

  const setLineTrack = async (index: number, trackId: string | null) => {
    const setlist = djSet.setlist.map((line, i) =>
      i === index ? { ...line, trackId: trackId ?? undefined } : line,
    );
    await persistSetlist(setlist);
    setLinkLineIndex(null);
  };

  const onStatusChange = async (status: DjSetStatus) => {
    const uc = await getDjSetUseCases();
    if (status === "performed") {
      const next = await uc.markPerformed(id, performedAt || undefined);
      setDjSet(next);
      return;
    }
    if (status === "cancelled") {
      const next = await uc.cancelDjSet(id);
      setDjSet(next);
      return;
    }
    const next = await uc.updateDjSet(id, { status });
    setDjSet(next);
  };

  const transitionPlanned = async () => {
    const uc = await getDjSetUseCases();
    const next = await uc.transitionPlannedToPerformed(id, performedAt || undefined);
    setDjSet(next);
  };

  return (
    <div className="space-y-4" data-testid="dj-set-detail">
      <Link href="/music-practice/dj-sets" className="text-sm text-accent">
        ← {t("musicPractice.tabs.djSets")}
      </Link>
      <h1 className="text-xl font-semibold">{djSet.title}</h1>

      {deleted && (
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm"
          onClick={async () => {
            const uc = await getDjSetUseCases();
            setDjSet(await uc.restoreDjSet(id));
          }}
          data-testid="dj-set-restore"
        >
          {t("musicPractice.restore")}
        </button>
      )}

      <select
        value={djSet.status}
        disabled={deleted}
        onChange={(e) => void onStatusChange(e.target.value as DjSetStatus)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        data-testid="dj-set-status"
      >
        {(["planned", "performed", "cancelled"] as DjSetStatus[]).map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>

      {(djSet.status === "performed" || djSet.status === "planned") && (
        <div>
          <label className="text-sm">{t("musicPractice.performedAt")}</label>
          <input
            type="date"
            value={performedAt}
            onChange={(e) => setPerformedAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="dj-set-performed-at"
          />
        </div>
      )}

      {djSet.status === "planned" && (
        <button
          type="button"
          className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground"
          onClick={() => void transitionPlanned()}
          data-testid="dj-set-transition-performed"
        >
          {t("musicPractice.dj.markPerformed")}
        </button>
      )}

      {djSet.status !== "cancelled" && !deleted && (
        <button
          type="button"
          className="text-sm text-destructive"
          onClick={() => void onStatusChange("cancelled")}
          data-testid="dj-set-cancel"
        >
          {t("musicPractice.dj.cancel")}
        </button>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">{t("musicPractice.setlist")}</h2>
        <ul className="space-y-2" data-testid="dj-set-setlist">
          {djSet.setlist.map((line, index) => (
            <li key={`${line.sortOrder}-${line.text}`} className="rounded-lg border border-border p-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>{line.text}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => void moveLine(index, -1)} aria-label="Up">
                    ↑
                  </button>
                  <button type="button" onClick={() => void moveLine(index, 1)} aria-label="Down">
                    ↓
                  </button>
                  <button type="button" onClick={() => void removeLine(index)}>
                    ×
                  </button>
                </div>
              </div>
              {line.trackId && (
                <p className="text-xs text-muted">
                  {formatTrackLabel(tracks.find((row) => row.id === line.trackId))}
                </p>
              )}
              <button
                type="button"
                className="text-xs text-accent"
                onClick={() => setLinkLineIndex(index)}
              >
                {t("musicPractice.trackLink.title")}
              </button>
              {linkLineIndex === index && (
                <TrackLinkPicker
                  value={line.trackId ?? null}
                  tracks={tracks}
                  onChange={(trackId) => void setLineTrack(index, trackId)}
                  testId={`dj-setline-track-${index}`}
                />
              )}
            </li>
          ))}
        </ul>
        <input
          value={lineText}
          onChange={(e) => setLineText(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="dj-set-setlist-line-text"
        />
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-sm"
          onClick={() => void addLine()}
          data-testid="dj-set-setlist-add"
        >
          {t("musicPractice.setlist.addLine")}
        </button>
      </section>

      {!deleted && (
        <button
          type="button"
          className="text-sm text-destructive"
          onClick={async () => {
            const uc = await getDjSetUseCases();
            setDjSet(await uc.deleteDjSet(id));
          }}
        >
          {t("action.delete")}
        </button>
      )}
    </div>
  );
}
