"use client";

import Link from "next/link";

import { ratingBadgeClass } from "@/components/rating-colors";
import { StarRating } from "@/components/StarRating";
import type { Item } from "@/domain/item";
import { t } from "@/i18n";

export type MusicArtistRowProps = {
  item: Item & { type: "music_artist" };
  onRatingChange: (rating: number) => void;
};

export function MusicArtistRow({ item, onRatingChange }: MusicArtistRowProps) {
  return (
    <li className="rounded-lg border border-border px-3 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/items/${item.id}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {item.title}
          </Link>
          {item.rating !== null ? (
            <span className={ratingBadgeClass(item.rating)} aria-label={t("field.rating")}>
              {item.rating}
            </span>
          ) : null}
        </div>
        {item.recommendedBy ? <p className="text-sm text-muted">{item.recommendedBy}</p> : null}
        <StarRating value={item.rating} onChange={onRatingChange} />
      </div>
    </li>
  );
}
