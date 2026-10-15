"use client";

import { useEffect, useState } from "react";

import type { CreateItemExtra } from "@/application/items";
import { getItemUseCases } from "@/composition/client";
import { defaultStatus, statusesFor, type MusicTrackStatus } from "@/domain/item";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { StarRating } from "@/components/StarRating";
import { RecommendedByInput } from "@/components/RecommendedByInput";
import { t, type MessageKey } from "@/i18n";

import { MultilineField } from "./multiline-field";

function ratingVisible(status: MusicTrackStatus): boolean {
  return status === "listened";
}

export type MusicTrackFieldValues = {
  title: string;
  artist: string;
  album: string;
  releaseYear: string;
  status: MusicTrackStatus;
  rating: number | null;
  recommendedBy: string;
  notes: string;
  spotifyUrl: string;
  soundcloudUrl: string;
};

export const emptyMusicTrackFieldValues = (): MusicTrackFieldValues => ({
  title: "",
  artist: "",
  album: "",
  releaseYear: "",
  status: defaultStatus("music_track") as MusicTrackStatus,
  rating: null,
  recommendedBy: "",
  notes: "",
  spotifyUrl: "",
  soundcloudUrl: "",
});

export type MusicTrackFieldsProps = {
  values: MusicTrackFieldValues;
  onChange: (values: MusicTrackFieldValues) => void;
  titleError?: string;
  artistError?: string;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function musicTrackFieldValuesToExtra(values: MusicTrackFieldValues): CreateItemExtra {
  const extra: CreateItemExtra = {
    artist: values.artist.trim(),
    status: values.status,
  };
  const album = optionalText(values.album);
  if (album) extra.album = album;
  const releaseYear = parseOptionalInt(values.releaseYear);
  if (releaseYear !== null) extra.releaseYear = releaseYear;
  const recommendedBy = optionalText(values.recommendedBy);
  if (recommendedBy) extra.recommendedBy = recommendedBy;
  const notes = optionalText(values.notes);
  if (notes) extra.notes = notes;
  const spotifyUrl = optionalText(values.spotifyUrl);
  if (spotifyUrl) extra.spotifyUrl = spotifyUrl;
  const soundcloudUrl = optionalText(values.soundcloudUrl);
  if (soundcloudUrl) extra.soundcloudUrl = soundcloudUrl;
  if (ratingVisible(values.status) && values.rating !== null) {
    extra.rating = values.rating;
  }
  return extra;
}

const statusOptions = statusesFor("music_track").map((value) => ({
  value,
  label: t(`status.${value}` as MessageKey),
}));

export function MusicTrackFields({
  values,
  onChange,
  titleError,
  artistError,
}: MusicTrackFieldsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getItemUseCases().then(async (useCases) => {
      const next = await useCases.musicArtistSuggestions(values.artist);
      if (!cancelled) setSuggestions(next);
    });
    return () => {
      cancelled = true;
    };
  }, [values.artist]);

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={t("field.title")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        error={titleError}
      />
      <TextField
        label={t("field.artist")}
        value={values.artist}
        onChange={(event) => onChange({ ...values, artist: event.target.value })}
        error={artistError}
        list="music-artist-suggestions"
      />
      {suggestions.length > 0 ? (
        <datalist id="music-artist-suggestions">
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      ) : null}
      <TextField
        label={t("field.album")}
        value={values.album}
        onChange={(event) => onChange({ ...values, album: event.target.value })}
      />
      <TextField
        label={t("field.releaseYear")}
        inputMode="numeric"
        value={values.releaseYear}
        onChange={(event) => onChange({ ...values, releaseYear: event.target.value })}
      />
      <Select
        label={t("field.status")}
        options={statusOptions}
        value={values.status}
        onChange={(event) =>
          onChange({ ...values, status: event.target.value as MusicTrackStatus })
        }
      />
      {ratingVisible(values.status) ? (
        <StarRating
          value={values.rating}
          onChange={(rating) => onChange({ ...values, rating })}
        />
      ) : null}
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
