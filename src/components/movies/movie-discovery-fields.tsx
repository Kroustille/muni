"use client";

import { BOOK_MOODS, BOOK_PACES, type BookMood, type BookPace, type Item, type ItemPatch } from "@/domain/item";
import { Select } from "@/components/ui/Select";
import { t, type MessageKey } from "@/i18n";

export type MovieDiscoveryFieldValues = {
  mood: BookMood | "";
  pace: BookPace | "";
};

export const emptyMovieDiscoveryFieldValues = (): MovieDiscoveryFieldValues => ({
  mood: "",
  pace: "",
});

export function itemToMovieDiscoveryValues(item: Item): MovieDiscoveryFieldValues {
  return {
    mood: item.mood ?? "",
    pace: item.pace ?? "",
  };
}

export function movieDiscoveryValuesToPatch(values: MovieDiscoveryFieldValues): ItemPatch {
  return {
    mood: values.mood === "" ? null : values.mood,
    pace: values.pace === "" ? null : values.pace,
  };
}

export type MovieDiscoveryFieldsProps = {
  values: MovieDiscoveryFieldValues;
  onChange: (values: MovieDiscoveryFieldValues) => void;
};

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

export function MovieDiscoveryFields({ values, onChange }: MovieDiscoveryFieldsProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <Select
        label={t("movies.discovery.mood")}
        options={moodOptions}
        value={values.mood}
        onChange={(event) =>
          onChange({ ...values, mood: event.target.value as BookMood | "" })
        }
      />
      <Select
        label={t("movies.discovery.pace")}
        options={paceOptions}
        value={values.pace}
        onChange={(event) =>
          onChange({ ...values, pace: event.target.value as BookPace | "" })
        }
      />
    </div>
  );
}
