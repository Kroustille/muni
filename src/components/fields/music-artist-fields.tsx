"use client";

import type { CreateItemExtra } from "@/application/items";
import { StarRating } from "@/components/StarRating";
import { TextField } from "@/components/ui/TextField";
import { t } from "@/i18n";

import { RecommendedByInput } from "@/components/RecommendedByInput";
import { MultilineField } from "./multiline-field";

export type MusicArtistFieldValues = {
  title: string;
  rating: number | null;
  recommendedBy: string;
  notes: string;
  spotifyUrl: string;
  soundcloudUrl: string;
};

export const emptyMusicArtistFieldValues = (): MusicArtistFieldValues => ({
  title: "",
  rating: null,
  recommendedBy: "",
  notes: "",
  spotifyUrl: "",
  soundcloudUrl: "",
});

export type MusicArtistFieldsProps = {
  values: MusicArtistFieldValues;
  onChange: (values: MusicArtistFieldValues) => void;
  titleError?: string;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function musicArtistFieldValuesToExtra(values: MusicArtistFieldValues): CreateItemExtra {
  const extra: CreateItemExtra = {};
  const recommendedBy = optionalText(values.recommendedBy);
  if (recommendedBy) extra.recommendedBy = recommendedBy;
  const notes = optionalText(values.notes);
  if (notes) extra.notes = notes;
  const spotifyUrl = optionalText(values.spotifyUrl);
  if (spotifyUrl) extra.spotifyUrl = spotifyUrl;
  const soundcloudUrl = optionalText(values.soundcloudUrl);
  if (soundcloudUrl) extra.soundcloudUrl = soundcloudUrl;
  if (values.rating !== null) extra.rating = values.rating;
  return extra;
}

export function MusicArtistFields({ values, onChange, titleError }: MusicArtistFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={t("field.name")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={titleError}
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">{t("field.rating")}</span>
        <StarRating
          value={values.rating}
          onChange={(rating) => onChange({ ...values, rating })}
        />
      </div>
      <RecommendedByInput
        value={values.recommendedBy}
        onChange={(recommendedBy) => onChange({ ...values, recommendedBy })}
      />
      <MultilineField
        label={t("field.notes")}
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
      />
      <TextField
        label={t("field.spotifyUrl")}
        value={values.spotifyUrl}
        onChange={(event) => onChange({ ...values, spotifyUrl: event.target.value })}
      />
      <TextField
        label={t("field.soundcloudUrl")}
        value={values.soundcloudUrl}
        onChange={(event) => onChange({ ...values, soundcloudUrl: event.target.value })}
      />
    </div>
  );
}
