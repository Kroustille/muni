"use client";

import type { BookTagSeriesFilter } from "@/application/books/book-library-filters";
import { t } from "@/i18n";

export type BookTagSeriesFiltersProps = {
  value: BookTagSeriesFilter;
  onChange: (value: BookTagSeriesFilter) => void;
  tags: readonly string[];
  seriesNames: readonly string[];
};

export function BookTagSeriesFilters({
  value,
  onChange,
  tags,
  seriesNames,
}: BookTagSeriesFiltersProps) {
  if (tags.length === 0 && seriesNames.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-3">
      {tags.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t("books.filter.tag")}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`min-h-11 rounded-lg border px-3 text-sm ${
                !value.tag ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
              onClick={() => onChange({ ...value, tag: null })}
            >
              {t("status.all")}
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`min-h-11 rounded-lg border px-3 text-sm ${
                  value.tag === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                }`}
                onClick={() => onChange({ ...value, tag })}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {seriesNames.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t("books.filter.series")}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`min-h-11 rounded-lg border px-3 text-sm ${
                !value.seriesName
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
              onClick={() => onChange({ ...value, seriesName: null })}
            >
              {t("status.all")}
            </button>
            {seriesNames.map((name) => (
              <button
                key={name}
                type="button"
                className={`min-h-11 rounded-lg border px-3 text-sm ${
                  value.seriesName === name
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                }`}
                onClick={() => onChange({ ...value, seriesName: name })}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
