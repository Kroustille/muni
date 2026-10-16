"use client";

import type { MovieTagFranchiseFilter } from "@/application/movies/movie-library-filters";
import { t } from "@/i18n";

export type MovieTagFranchiseFiltersProps = {
  value: MovieTagFranchiseFilter;
  onChange: (value: MovieTagFranchiseFilter) => void;
  tags: readonly string[];
  franchiseNames: readonly string[];
};

export function MovieTagFranchiseFilters({
  value,
  onChange,
  tags,
  franchiseNames,
}: MovieTagFranchiseFiltersProps) {
  if (tags.length === 0 && franchiseNames.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-3">
      {tags.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t("movies.filter.tag")}</span>
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
      {franchiseNames.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t("movies.filter.franchise")}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`min-h-11 rounded-lg border px-3 text-sm ${
                !value.franchiseName
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
              onClick={() => onChange({ ...value, franchiseName: null })}
            >
              {t("status.all")}
            </button>
            {franchiseNames.map((name) => (
              <button
                key={name}
                type="button"
                className={`min-h-11 rounded-lg border px-3 text-sm ${
                  value.franchiseName === name
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                }`}
                onClick={() => onChange({ ...value, franchiseName: name })}
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
