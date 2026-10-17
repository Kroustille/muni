"use client";

import { ratingBadgeClass } from "@/components/rating-colors";
import { StarRating } from "@/components/StarRating";
import { DeleteWithUndoButton } from "@/components/UndoToast";
import type { Item } from "@/domain/item";
import { t } from "@/i18n";
import { ListRowShell } from "./ListRowShell";
import { ListRowTitle } from "./ListRowTitle";

export type MusicArtistRowProps = {
  item: Item & { type: "music_artist" };
  onRatingChange: (rating: number) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  selectionMode?: boolean;
  bulkSelected?: boolean;
  onBulkToggle?: () => void;
  showDelete?: boolean;
};

export function MusicArtistRow({
  item,
  onRatingChange,
  onSelect,
  selected,
  selectionMode = false,
  bulkSelected = false,
  onBulkToggle,
  showDelete = false,
}: MusicArtistRowProps) {
  return (
    <ListRowShell itemType="music_artist" selected={selected || bulkSelected}>
      <div className="flex items-start gap-2">
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
            {item.rating !== null ? (
              <span className={ratingBadgeClass(item.rating)} aria-label={t("field.rating")}>
                {item.rating}
              </span>
            ) : null}
          </div>
          {item.recommendedBy ? <p className="text-sm text-muted">{item.recommendedBy}</p> : null}
          <StarRating value={item.rating} onChange={onRatingChange} />
        </div>
        {showDelete && !selectionMode ? (
          <DeleteWithUndoButton itemId={item.id} className="shrink-0" />
        ) : null}
      </div>
    </ListRowShell>
  );
}
