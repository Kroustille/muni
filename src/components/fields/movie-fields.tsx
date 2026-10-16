"use client";

import type { CreateItemExtra } from "@/application/items";
import { allowedMovieStatuses } from "@/application/movies/movie-status-rules";
import { defaultWatchedAtForStatus } from "@/application/movies/movie-status-rules";
import { defaultStatus, type MediaKind, type MovieStatus } from "@/domain/item";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { t, type MessageKey } from "@/i18n";

import { StarRating } from "@/components/StarRating";
import { RecommendedByInput } from "@/components/RecommendedByInput";
import { TagChipEditor } from "@/components/books/tag-chip-editor";
import { MultilineField } from "./multiline-field";

function ratingVisible(status: MovieStatus): boolean {
  return status === "watched";
}

function watchedAtVisible(status: MovieStatus): boolean {
  return status === "watched";
}

function todayIsoDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export type MovieFieldValues = {
  title: string;
  status: MovieStatus;
  rating: number | null;
  recommendedBy: string;
  notes: string;
  tags: string[];
  franchiseName: string;
  franchiseOrder: string;
  watchedAt: string;
};

export const emptyMovieFieldValues = (): MovieFieldValues => ({
  title: "",
  status: defaultStatus("movie") as MovieStatus,
  rating: null,
  recommendedBy: "",
  notes: "",
  tags: [],
  franchiseName: "",
  franchiseOrder: "",
  watchedAt: "",
});

export type MovieFieldsProps = {
  values: MovieFieldValues;
  onChange: (values: MovieFieldValues) => void;
  titleError?: string;
  mediaKind?: MediaKind | null;
  /** Read-only catalog metadata (M4). */
  catalogRating?: number | null;
  imdbId?: string | null;
  director?: string | null;
  cast?: string[] | null;
  tagSuggestions?: readonly string[];
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function statusOptionsFor(mediaKind: MediaKind | null | undefined) {
  return allowedMovieStatuses(mediaKind ?? null).map((value) => ({
    value,
    label: t(`status.${value}` as MessageKey),
  }));
}

export function movieFieldValuesToExtra(values: MovieFieldValues): CreateItemExtra {
  const extra: CreateItemExtra = { status: values.status };
  const recommendedBy = optionalText(values.recommendedBy);
  if (recommendedBy) extra.recommendedBy = recommendedBy;
  const notes = optionalText(values.notes);
  if (notes) extra.notes = notes;
  if (ratingVisible(values.status) && values.rating !== null) {
    extra.rating = values.rating;
  }
  const tags = values.tags.map((tag) => tag.trim()).filter((tag) => tag !== "");
  extra.tags = tags.length === 0 ? null : tags;
  const franchiseName = optionalText(values.franchiseName);
  if (franchiseName) extra.franchiseName = franchiseName;
  const orderRaw = values.franchiseOrder.trim();
  if (orderRaw !== "") {
    const order = Number(orderRaw);
    if (!Number.isNaN(order)) extra.franchiseOrder = order;
  }
  if (watchedAtVisible(values.status)) {
    const watchedAt = optionalText(values.watchedAt);
    extra.watchedAt = watchedAt ?? defaultWatchedAtForStatus("watched", todayIsoDate());
  }
  return extra;
}

export function MovieFields({
  values,
  onChange,
  titleError,
  mediaKind,
  catalogRating,
  imdbId,
  director,
  cast,
  tagSuggestions = [],
}: MovieFieldsProps) {
  const statusOptions = statusOptionsFor(mediaKind);

  return (
    <div className="flex flex-col gap-4">
      {catalogRating != null ? (
        <p className="text-sm text-muted">
          {t("field.catalogRating")}: {catalogRating}
        </p>
      ) : null}
      {imdbId != null && imdbId.trim() !== "" ? (
        <p className="text-sm text-muted">
          {t("field.imdbId")}: {imdbId}
        </p>
      ) : null}
      {director ? (
        <p className="text-sm text-muted">
          {t("field.director")}: {director}
        </p>
      ) : null}
      {cast && cast.length > 0 ? (
        <p className="text-sm text-muted">
          {t("field.cast")}: {cast.join(", ")}
        </p>
      ) : null}
      <TextField
        label={t("field.title")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={titleError}
        autoComplete="off"
      />
      <Select
        label={t("field.status")}
        options={statusOptions}
        value={values.status}
        onChange={(event) => {
          const status = event.target.value as MovieStatus;
          const next = { ...values, status };
          if (status === "watched" && next.watchedAt.trim() === "") {
            next.watchedAt = todayIsoDate();
          }
          if (status !== "watched") {
            next.watchedAt = "";
          }
          onChange(next);
        }}
      />
      {watchedAtVisible(values.status) ? (
        <TextField
          label={t("movies.watchedAt")}
          type="date"
          value={values.watchedAt}
          onChange={(event) => onChange({ ...values, watchedAt: event.target.value })}
          autoComplete="off"
        />
      ) : null}
      {ratingVisible(values.status) ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">{t("field.rating")}</span>
          <StarRating
            value={values.rating}
            onChange={(rating) => onChange({ ...values, rating })}
          />
        </div>
      ) : null}
      <RecommendedByInput
        value={values.recommendedBy}
        onChange={(recommendedBy) => onChange({ ...values, recommendedBy })}
      />
      <TagChipEditor
        tags={values.tags}
        suggestions={tagSuggestions}
        onChange={(tags) => onChange({ ...values, tags })}
      />
      <TextField
        label={t("movies.franchise.name")}
        value={values.franchiseName}
        onChange={(event) => onChange({ ...values, franchiseName: event.target.value })}
        autoComplete="off"
      />
      <TextField
        label={t("movies.franchise.order")}
        value={values.franchiseOrder}
        onChange={(event) => onChange({ ...values, franchiseOrder: event.target.value })}
        inputMode="numeric"
        autoComplete="off"
      />
      <MultilineField
        label={t("field.notes")}
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
      />
    </div>
  );
}
