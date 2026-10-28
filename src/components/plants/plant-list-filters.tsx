"use client";

import type { PlantLocationTag } from "@/domain/plant";
import { t } from "@/i18n";

export type PlantListFilterValue = "all" | PlantLocationTag | "potager";

export type PlantListFiltersProps = {
  value: PlantListFilterValue;
  onChange: (value: PlantListFilterValue) => void;
};

const CHIPS: { value: PlantListFilterValue; labelKey: "plants.filter.all" | "plants.filter.indoor" | "plants.filter.outdoor" | "plants.filter.both" | "plants.filter.potager" }[] =
  [
    { value: "all", labelKey: "plants.filter.all" },
    { value: "indoor", labelKey: "plants.filter.indoor" },
    { value: "outdoor", labelKey: "plants.filter.outdoor" },
    { value: "both", labelKey: "plants.filter.both" },
    { value: "potager", labelKey: "plants.filter.potager" },
  ];

export function PlantListFilters({ value, onChange }: PlantListFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="plant-list-filters">
      {CHIPS.map((chip) => {
        const active = value === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            data-testid={`plant-filter-${chip.value}`}
            aria-pressed={active}
            className={`min-h-9 rounded-full border px-3 text-sm ${
              active ? "border-accent bg-accent/10 text-foreground" : "border-border bg-surface text-muted"
            }`}
            onClick={() => onChange(chip.value)}
          >
            {t(chip.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

export function plantMatchesFilter(
  locationTag: PlantLocationTag,
  filter: PlantListFilterValue,
): boolean {
  if (filter === "all") return true;
  if (filter === "potager") return locationTag === "outdoor" || locationTag === "both";
  return locationTag === filter;
}
