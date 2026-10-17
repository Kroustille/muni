"use client";

import { Select } from "@/components/ui/Select";
import { ratingBadgeClass } from "@/components/rating-colors";
import { StarRating } from "@/components/StarRating";
import {
  statusesFor,
  type BookStatus,
  type Item,
  type MovieStatus,
  type MusicTrackStatus,
} from "@/domain/item";
import { t, type MessageKey } from "@/i18n";
import { DeleteWithUndoButton } from "@/components/UndoToast";
import { ListRowShell } from "./ListRowShell";
import { ListRowTitle } from "./ListRowTitle";

export type BookMovieRowProps = {
  item: Item & ({ type: "book" } | { type: "movie" } | { type: "music_track" });
  onStatusChange: (status: BookStatus | MovieStatus | MusicTrackStatus) => void;
  onRatingChange: (rating: number) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  shellAs?: "li" | "div";
  selectionMode?: boolean;
  bulkSelected?: boolean;
  onBulkToggle?: () => void;
  showDelete?: boolean;
};

function ratingVisible(status: string | null): boolean {
  return status === "read" || status === "watched" || status === "listened";
}

function secondaryText(item: BookMovieRowProps["item"]): string | null {
  if (item.type === "book") return item.author;
  if (item.type === "music_track") return item.artist;
  return item.recommendedBy;
}

export function BookMovieRow({
  item,
  onStatusChange,
  onRatingChange,
  onSelect,
  selected,
  shellAs,
  selectionMode = false,
  bulkSelected = false,
  onBulkToggle,
  showDelete = false,
}: BookMovieRowProps) {
  const status = item.status ?? statusesFor(item.type)[0];
  const statusOptions = statusesFor(item.type).map((value) => ({
    value,
    label: t(`status.${value}` as MessageKey),
  }));

  return (
    <ListRowShell itemType={item.type} selected={selected || bulkSelected} as={shellAs}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start gap-2">
          {selectionMode ? (
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 cursor-pointer accent-primary"
              checked={bulkSelected}
              onChange={() => onBulkToggle?.()}
              aria-label={item.title}
            />
          ) : null}
          <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <ListRowTitle itemId={item.id} onSelect={onSelect}>
            {item.title}
          </ListRowTitle>
          {ratingVisible(status) && item.rating !== null ? (
            <span className={ratingBadgeClass(item.rating)} aria-label={t("field.rating")}>
              {item.rating}
            </span>
          ) : null}
        </div>
        {secondaryText(item) ? <p className="text-sm text-muted">{secondaryText(item)}</p> : null}
        <Select
          label={t("field.status")}
          options={statusOptions}
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as BookStatus | MovieStatus | MusicTrackStatus)
          }
        />
        {ratingVisible(status) ? (
          <StarRating value={item.rating} onChange={onRatingChange} />
        ) : null}
          </div>
          {showDelete && !selectionMode ? (
            <DeleteWithUndoButton itemId={item.id} className="shrink-0" />
          ) : null}
        </div>
      </div>
    </ListRowShell>
  );
}
