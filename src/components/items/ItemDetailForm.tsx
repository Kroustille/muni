"use client";

import { useCallback, useState, type FormEvent } from "react";
import type { Item, ItemPatch } from "@/domain/item";
import {
  BookFields,
  type BookFieldValues,
  MovieFields,
  type MovieFieldValues,
  MusicArtistFields,
  type MusicArtistFieldValues,
  MusicTrackFields,
  type MusicTrackFieldValues,
  RecipeFields,
  type RecipeFieldValues,
  ShoppingFields,
  type ShoppingFieldValues,
} from "@/components/fields";
import { BookEditionsSection } from "@/components/books/book-editions-section";
import {
  BookDiscoveryFields,
  bookDiscoveryValuesToPatch,
  emptyBookDiscoveryFieldValues,
  itemToBookDiscoveryValues,
  type BookDiscoveryFieldValues,
} from "@/components/books/book-discovery-fields";
import { getItemUseCases } from "@/composition/client";
import { Button } from "@/components/ui/Button";
import { ExternalLinkActions } from "@/components/music/external-link-actions";
import { t } from "@/i18n";
import {
  type FieldValues,
  patchFromValues,
  validateFieldValues,
  valuesFromItem,
} from "./item-detail-shared";

export type ItemDetailFormProps = {
  item: Item;
  onSave: (patch: ItemPatch) => Promise<Item>;
  onDelete?: () => void;
  compact?: boolean;
  onLibraryChange?: () => void;
  tagSuggestions?: readonly string[];
};

export function ItemDetailForm({
  item,
  onSave,
  onDelete,
  compact,
  onLibraryChange,
  tagSuggestions,
}: ItemDetailFormProps) {
  const [values, setValues] = useState<FieldValues>(() => valuesFromItem(item));
  const [discoveryValues, setDiscoveryValues] = useState<BookDiscoveryFieldValues>(() =>
    item.type === "book" ? itemToBookDiscoveryValues(item) : emptyBookDiscoveryFieldValues(),
  );
  const [titleError, setTitleError] = useState<string | undefined>();
  const [artistError, setArtistError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    const errors = validateFieldValues(item, values);
    if (errors.titleError || errors.artistError) {
      setTitleError(errors.titleError);
      setArtistError(errors.artistError);
      return;
    }
    setSaving(true);
    setTitleError(undefined);
    setArtistError(undefined);
    try {
      const patch =
        item.type === "book"
          ? { ...patchFromValues(item, values), ...bookDiscoveryValuesToPatch(discoveryValues) }
          : patchFromValues(item, values);
      const updated = await onSave(patch);
      setValues(valuesFromItem(updated));
      if (updated.type === "book") {
        setDiscoveryValues(itemToBookDiscoveryValues(updated));
      }
    } finally {
      setSaving(false);
    }
  }, [item, onSave, values, discoveryValues]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };

  return (
    <form className={`flex flex-col ${compact ? "gap-4" : "gap-6"}`} onSubmit={onSubmit}>
      {item.type === "shopping" ? (
        <ShoppingFields
          values={values as ShoppingFieldValues}
          onChange={(next) => {
            setValues(next);
            setTitleError(undefined);
          }}
          titleError={titleError}
        />
      ) : null}
      {item.type === "book" ? (
        <>
          <BookFields
            values={values as BookFieldValues}
            pageCount={item.pageCount}
            tagSuggestions={tagSuggestions}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
          />
          <BookEditionsSection
            item={item as Item & { type: "book" }}
            onChanged={async () => {
              const useCases = await getItemUseCases();
              const refreshed = await useCases.getItem(item.id);
              if (refreshed) setValues(valuesFromItem(refreshed));
              onLibraryChange?.();
            }}
          />
        </>
      ) : null}
      {item.type === "book" ? (
        <BookDiscoveryFields values={discoveryValues} onChange={setDiscoveryValues} />
      ) : null}
      {item.type === "movie" ? (
        <MovieFields
          values={values as MovieFieldValues}
          catalogRating={item.catalogRating}
          imdbId={item.imdbId}
          onChange={(next) => {
            setValues(next);
            setTitleError(undefined);
          }}
          titleError={titleError}
        />
      ) : null}
      {item.type === "recipe" ? (
        <RecipeFields
          values={values as RecipeFieldValues}
          onChange={(next) => {
            setValues(next);
            setTitleError(undefined);
          }}
          titleError={titleError}
        />
      ) : null}
      {item.type === "music_artist" ? (
        <>
          <MusicArtistFields
            values={values as MusicArtistFieldValues}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
          />
          <ExternalLinkActions
            spotifyUrl={(values as MusicArtistFieldValues).spotifyUrl}
            soundcloudUrl={(values as MusicArtistFieldValues).soundcloudUrl}
          />
        </>
      ) : null}
      {item.type === "music_track" ? (
        <>
          <MusicTrackFields
            values={values as MusicTrackFieldValues}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
              setArtistError(undefined);
            }}
            titleError={titleError}
            artistError={artistError}
          />
          <ExternalLinkActions
            spotifyUrl={(values as MusicTrackFieldValues).spotifyUrl}
            soundcloudUrl={(values as MusicTrackFieldValues).soundcloudUrl}
          />
        </>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={saving}>
          {t("action.save")}
        </Button>
        {onDelete ? (
          <Button type="button" variant="danger" onClick={onDelete}>
            {t("action.delete")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
