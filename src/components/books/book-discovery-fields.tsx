"use client";

import { BOOK_MOODS, BOOK_PACES, type BookMood, type BookPace } from "@/domain/item";
import { Select } from "@/components/ui/Select";
import { t, type MessageKey } from "@/i18n";

export type BookDiscoveryFieldValues = {
  mood: BookMood | "";
  pace: BookPace | "";
};

export const emptyBookDiscoveryFieldValues = (): BookDiscoveryFieldValues => ({
  mood: "",
  pace: "",
});

export type BookDiscoveryFieldsProps = {
  values: BookDiscoveryFieldValues;
  onChange: (values: BookDiscoveryFieldValues) => void;
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

export function bookDiscoveryValuesToPatch(values: BookDiscoveryFieldValues) {
  return {
    mood: values.mood === "" ? null : values.mood,
    pace: values.pace === "" ? null : values.pace,
  };
}

export function itemToBookDiscoveryValues(item: {
  mood: BookMood | null;
  pace: BookPace | null;
}): BookDiscoveryFieldValues {
  return {
    mood: item.mood ?? "",
    pace: item.pace ?? "",
  };
}

export function BookDiscoveryFields({ values, onChange }: BookDiscoveryFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Select
        label={t("books.discovery.mood")}
        options={moodOptions}
        value={values.mood}
        onChange={(event) =>
          onChange({ ...values, mood: event.target.value as BookMood | "" })
        }
      />
      <Select
        label={t("books.discovery.pace")}
        options={paceOptions}
        value={values.pace}
        onChange={(event) =>
          onChange({ ...values, pace: event.target.value as BookPace | "" })
        }
      />
    </div>
  );
}
