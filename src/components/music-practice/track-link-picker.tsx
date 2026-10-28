"use client";

import { useState } from "react";

import type { Item } from "@/domain/item";
import { filterItemsForListLocalSearch } from "@/domain/list-local-search";
import { t } from "@/i18n";

export function formatTrackLabel(track: Item | undefined): string {
  if (track === undefined || track.deletedAt !== null) {
    return t("musicPractice.trackLink.orphan");
  }
  const artist = track.artist?.trim();
  if (artist) return `${track.title} — ${artist}`;
  return track.title;
}

export type TrackLinkPickerProps = {
  value: string | null;
  onChange: (trackId: string | null) => void;
  tracks: Item[];
  testId?: string;
};

export function TrackLinkPicker({ value, onChange, tracks, testId = "track-link-picker" }: TrackLinkPickerProps) {
  const activeTracks = tracks.filter((row) => row.deletedAt === null);
  const linked = value !== null ? tracks.find((row) => row.id === value) : undefined;

  return (
    <div className="space-y-2" data-testid={testId}>
      <p className="text-sm font-medium">{t("musicPractice.trackLink.title")}</p>
      <p className="text-xs text-muted">{t("musicPractice.trackLink.helper")}</p>
      {value !== null && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span data-testid={`${testId}-label`}>{formatTrackLabel(linked)}</span>
          <button
            type="button"
            className="text-xs text-accent"
            onClick={() => onChange(null)}
            data-testid={`${testId}-clear`}
          >
            {t("musicPractice.trackLink.clear")}
          </button>
        </div>
      )}
      <label className="block text-xs text-muted">{t("musicPractice.trackLink.search")}</label>
      <TrackSearchList tracks={activeTracks} onPick={(id) => onChange(id)} excludeId={value} />
    </div>
  );
}

function TrackSearchList({
  tracks,
  onPick,
  excludeId,
}: {
  tracks: Item[];
  onPick: (id: string) => void;
  excludeId: string | null;
}) {
  const [query, setQuery] = useState("");
  const filtered = filterItemsForListLocalSearch(tracks, query).filter((row) => row.id !== excludeId);

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        data-testid="track-link-search"
      />
      <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {filtered.length === 0 ? (
          <li className="text-xs text-muted">—</li>
        ) : (
          filtered.slice(0, 20).map((track) => (
            <li key={track.id}>
              <button
                type="button"
                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-muted/60"
                onClick={() => onPick(track.id)}
                data-testid={`track-link-option-${track.id}`}
              >
                {formatTrackLabel(track)}
              </button>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
