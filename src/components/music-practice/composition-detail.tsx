"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getItemUseCases, getMusicCompositionUseCases } from "@/composition/client";
import type { Item } from "@/domain/item";
import type { MusicComposition, MusicCompositionStatus } from "@/domain/music-composition";
import { compositionStatusLabel } from "@/components/music-practice/status-labels";
import { t } from "@/i18n";
import { formatTrackLabel, TrackLinkPicker } from "@/components/music-practice/track-link-picker";

function statusLabel(status: MusicCompositionStatus): string {
  return compositionStatusLabel(status);
}

const ALL_STATUSES: MusicCompositionStatus[] = [
  "idea",
  "in_progress",
  "paused",
  "finished",
  "archived",
];

export function CompositionDetail({ id }: { id: string }) {
  const [composition, setComposition] = useState<MusicComposition | undefined>();
  const [tracks, setTracks] = useState<Item[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [finishedAt, setFinishedAt] = useState("");

  const refresh = async () => {
    const uc = await getMusicCompositionUseCases();
    const row = await uc.getComposition(id);
    setComposition(row);
    if (row?.finishedAt) setFinishedAt(row.finishedAt);
    const items = await getItemUseCases();
    setTracks(await items.listItems("music_track"));
  };

  useEffect(() => {
    void refresh();
  }, [id]);

  if (composition === undefined) {
    return <p className="text-sm text-muted">…</p>;
  }

  const deleted = composition.deletedAt !== null;

  const saveStatus = async (status: MusicCompositionStatus) => {
    const uc = await getMusicCompositionUseCases();
    const patch =
      status === "finished"
        ? { status, finishedAt: finishedAt || undefined }
        : { status };
    const next = await uc.updateComposition(id, patch);
    setComposition(next);
  };

  const appendNote = async () => {
    if (!noteText.trim()) return;
    const uc = await getMusicCompositionUseCases();
    const next = await uc.appendSessionNote(id, {
      date: noteDate || undefined,
      text: noteText,
    });
    setComposition(next);
    setNoteText("");
  };

  const restore = async () => {
    const uc = await getMusicCompositionUseCases();
    const next = await uc.restoreComposition(id);
    setComposition(next);
  };

  const softDelete = async () => {
    const uc = await getMusicCompositionUseCases();
    const next = await uc.deleteComposition(id);
    setComposition(next);
  };

  const updateLinkedTracks = async (ids: string[]) => {
    const uc = await getMusicCompositionUseCases();
    const next = await uc.updateComposition(id, { linkedTrackIds: ids });
    setComposition(next);
  };

  const linkedIds = composition.linkedTrackIds ?? [];

  return (
    <div className="space-y-4" data-testid="composition-detail">
      <Link href="/music-practice/compositions" className="text-sm text-accent">
        ← {t("musicPractice.tabs.compositions")}
      </Link>
      <h1 className="text-xl font-semibold">{composition.title}</h1>

      {deleted && (
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm"
          onClick={() => void restore()}
          data-testid="composition-restore"
        >
          {t("musicPractice.restore")}
        </button>
      )}

      <label className="block text-sm">{t("field.status")}</label>
      <select
        value={composition.status}
        disabled={deleted}
        onChange={(e) => void saveStatus(e.target.value as MusicCompositionStatus)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        data-testid="composition-status"
      >
        {ALL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>

      {composition.status === "finished" && (
        <div>
          <label className="text-sm">{t("musicPractice.finishedAt")}</label>
          <input
            type="date"
            value={finishedAt}
            onChange={(e) => setFinishedAt(e.target.value)}
            onBlur={() => void saveStatus("finished")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="composition-finished-at"
          />
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">{t("musicPractice.sessionNotes.add")}</h2>
        <input
          type="date"
          value={noteDate}
          onChange={(e) => setNoteDate(e.target.value)}
          aria-label={t("musicPractice.sessionNotes.date")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="composition-note-date"
        />
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          aria-label={t("musicPractice.sessionNotes.text")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="composition-note-text"
        />
        <button
          type="button"
          className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground"
          onClick={() => void appendNote()}
          data-testid="composition-note-submit"
        >
          {t("action.add")}
        </button>
        <ul className="space-y-1 text-sm" data-testid="composition-session-notes">
          {composition.sessionNotes.map((note) => (
            <li key={`${note.date}-${note.text}`}>
              <span className="text-muted">{note.date}</span> — {note.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">{t("musicPractice.linkedTracks")}</h2>
        {linkedIds.map((trackId) => (
          <div key={trackId} className="flex items-center justify-between text-sm">
            <span>{formatTrackLabel(tracks.find((row) => row.id === trackId))}</span>
            <button
              type="button"
              className="text-xs text-accent"
              onClick={() => void updateLinkedTracks(linkedIds.filter((x) => x !== trackId))}
            >
              {t("musicPractice.trackLink.clear")}
            </button>
          </div>
        ))}
        <TrackLinkPicker
          value={null}
          tracks={tracks}
          onChange={(trackId) => {
            if (trackId === null) return;
            if (linkedIds.includes(trackId)) return;
            void updateLinkedTracks([...linkedIds, trackId]);
          }}
          testId="composition-track-picker"
        />
      </section>

      {!deleted && (
        <button
          type="button"
          className="text-sm text-destructive"
          onClick={() => void softDelete()}
          data-testid="composition-delete"
        >
          {t("action.delete")}
        </button>
      )}
    </div>
  );
}
