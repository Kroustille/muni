"use client";

import { t } from "@/i18n";

export type StarRatingProps = {
  value: number | null;
  onChange: (rating: number) => void;
};

const STARS = [1, 2, 3, 4, 5] as const;

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div role="group" aria-label={t("field.rating")} className="flex gap-1">
      {STARS.map((stars) => (
        <button
          key={stars}
          type="button"
          className="min-h-9 min-w-9 rounded-md border border-border px-2 text-sm transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:font-semibold aria-pressed:text-primary-foreground aria-pressed:shadow-sm"
          aria-pressed={value === stars}
          onClick={() => onChange(stars)}
        >
          {stars}
        </button>
      ))}
    </div>
  );
}
