"use client";

import { t } from "@/i18n";

import { ratingTierClass } from "./rating-colors";

export type StarRatingProps = {
  value: number | null;
  onChange: (rating: number) => void;
};

const STARS = [1, 2, 3, 4, 5] as const;

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div role="group" aria-label={t("field.rating")} className="flex gap-1">
      {STARS.map((stars) => {
        const filled = value !== null && stars <= value;
        const selected = value === stars;
        return (
          <button
            key={stars}
            type="button"
            className={`cursor-pointer min-h-9 min-w-9 rounded-md border px-2 text-sm font-semibold transition-colors ${
              filled
                ? `${ratingTierClass(stars)} shadow-sm`
                : "border-border bg-surface text-muted"
            } ${selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
            aria-pressed={selected}
            onClick={() => onChange(stars)}
          >
            {stars}
          </button>
        );
      })}
    </div>
  );
}
