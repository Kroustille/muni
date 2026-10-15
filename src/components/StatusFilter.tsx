"use client";

import { statusesFor, type ItemStatus } from "@/domain/item";
import { t, type MessageKey } from "@/i18n";

export type StatusFilterValue = "all" | ItemStatus;

export type StatusFilterProps = {
  itemType: "book" | "movie" | "music_track";
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
};

export function StatusFilter({ itemType, value, onChange }: StatusFilterProps) {
  const options: { value: StatusFilterValue; label: string }[] = [
    { value: "all", label: t("status.all") },
    ...statusesFor(itemType).map((status) => ({
      value: status as ItemStatus,
      label: t(`status.${status}` as MessageKey),
    })),
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`cursor-pointer min-h-11 rounded-lg border px-3 text-sm ${
            value === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
