"use client";

import { LIST_SORT_MODES, type ListSortMode } from "@/domain/list-sort";
import { t } from "@/i18n";

export type ListSortFilterProps = {
  value: ListSortMode;
  onChange: (value: ListSortMode) => void;
};

const LABEL_KEY: Record<ListSortMode, Parameters<typeof t>[0]> = {
  newest: "list.sort.newest",
  rating: "list.sort.rating",
};

export function ListSortFilter({ value, onChange }: ListSortFilterProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {LIST_SORT_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`min-h-11 rounded-lg border px-3 text-sm ${
            value === mode
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-surface text-foreground"
          }`}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          {t(LABEL_KEY[mode])}
        </button>
      ))}
    </div>
  );
}
