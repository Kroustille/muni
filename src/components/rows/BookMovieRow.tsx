"use client";

import Link from "next/link";
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

export type BookMovieRowProps = {
  item: Item & ({ type: "book" } | { type: "movie" } | { type: "music_track" });
  onStatusChange: (status: BookStatus | MovieStatus | MusicTrackStatus) => void;
  onRatingChange: (rating: number) => void;
};

function ratingVisible(status: string | null): boolean {
  return status === "read" || status === "watched" || status === "listened";
}

function secondaryText(item: BookMovieRowProps["item"]): string | null {
  if (item.type === "book") return item.author;
  if (item.type === "music_track") return item.artist;
  return item.recommendedBy;
}

export function BookMovieRow({ item, onStatusChange, onRatingChange }: BookMovieRowProps) {
  const status = item.status ?? statusesFor(item.type)[0];
  const statusOptions = statusesFor(item.type).map((value) => ({
    value,
    label: t(`status.${value}` as MessageKey),
  }));

  return (
    <li className="rounded-lg border border-border px-3 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/items/${item.id}`}
            className="cursor-pointer font-medium underline-offset-2 hover:underline"
          >
            {item.title}
          </Link>
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
    </li>
  );
}
