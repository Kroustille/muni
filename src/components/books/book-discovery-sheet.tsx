"use client";

import type { BookDiscoveryFilter } from "@/application/books/discovery-filters";
import { collectLibraryTags } from "@/application/books/book-library-filters";
import {
  BOOK_MOODS,
  BOOK_PACES,
  statusesFor,
  type BookMood,
  type BookPace,
  type Item,
  type ItemStatus,
} from "@/domain/item";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { t, type MessageKey } from "@/i18n";

export type BookDiscoverySheetProps = {
  open: boolean;
  onClose: () => void;
  value: BookDiscoveryFilter;
  onChange: (value: BookDiscoveryFilter) => void;
  libraryBooks: readonly Item[];
};

const statusOptions = [
  { value: "", label: t("status.all") },
  ...statusesFor("book").map((status) => ({
    value: status,
    label: t(`status.${status}` as MessageKey),
  })),
];

const moodOptions = [
  { value: "", label: t("status.all") },
  ...BOOK_MOODS.map((value) => ({
    value,
    label: t(`books.mood.${value}` as MessageKey),
  })),
];

const paceOptions = [
  { value: "", label: t("status.all") },
  ...BOOK_PACES.map((value) => ({
    value,
    label: t(`books.pace.${value}` as MessageKey),
  })),
];

export function BookDiscoverySheet({
  open,
  onClose,
  value,
  onChange,
  libraryBooks,
}: BookDiscoverySheetProps) {
  if (!open) return null;

  const tags = collectLibraryTags(libraryBooks);
  const selectedTags = value.tags ?? [];

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((entry) => entry !== tag)
      : [...selectedTags, tag];
    onChange({ ...value, tags: next });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("books.discovery.filters")}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg">{t("books.discovery.filters")}</h2>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("action.close")}
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <Select
            label={t("field.status")}
            options={statusOptions}
            value={value.status ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                status: (event.target.value || null) as ItemStatus | null,
              })
            }
          />
          <Select
            label={t("books.discovery.mood")}
            options={moodOptions}
            value={value.mood ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                mood: (event.target.value || null) as BookMood | null,
              })
            }
          />
          <Select
            label={t("books.discovery.pace")}
            options={paceOptions}
            value={value.pace ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                pace: (event.target.value || null) as BookPace | null,
              })
            }
          />
          {tags.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">{t("books.tags")}</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`min-h-11 rounded-lg border px-3 text-sm ${
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
