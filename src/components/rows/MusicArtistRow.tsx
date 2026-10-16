"use client";

import { ratingBadgeClass } from "@/components/rating-colors";
import { StarRating } from "@/components/StarRating";
import type { Item } from "@/domain/item";
import { t } from "@/i18n";
import { ListRowShell } from "./ListRowShell";
import { ListRowTitle } from "./ListRowTitle";

export type MusicArtistRowProps = {
  item: Item & { type: "music_artist" };
  onRatingChange: (rating: number) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
};

export function MusicArtistRow({ item, onRatingChange, onSelect, selected }: MusicArtistRowProps) {
  return (
    <ListRowShell itemType="music_artist" selected={selected}>
      <div className="flex flex-col gap-2">
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
    </ListRowShell>
  );
}
