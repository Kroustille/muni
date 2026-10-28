"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Item, ItemPatch } from "@/domain/item";
import {
  MusicArtistFields,
  type MusicArtistFieldValues,
  MusicTrackFields,
  type MusicTrackFieldValues,
  RecipeFields,
  recipeSourcePayloadFromValues,
  type RecipeFieldValues,
  ShoppingFields,
  type ShoppingFieldValues,
} from "@/components/fields";
import {
  BookDetailSections,
  emptyBookDiscoveryFieldValues,
  itemToBookDiscoveryValues,
} from "@/components/items/BookDetailSections";
import { MovieDetailSections } from "@/components/items/MovieDetailSections";
import { RecipeCookedActions } from "@/components/recipes/recipe-cooked-actions";
import { bookDiscoveryValuesToPatch } from "@/components/books/book-discovery-fields";
import type { BookDiscoveryFieldValues } from "@/components/books/book-discovery-fields";
import { Button } from "@/components/ui/Button";
import { ExternalLinkActions } from "@/components/music/external-link-actions";
import { t } from "@/i18n";
import {
  type FieldValues,
  patchFromValues,
  recipeValuesToPatch,
  validateFieldValues,
  valuesFromItem,
} from "./item-detail-shared";
import { getCookbookUseCases, getItemUseCases } from "@/composition/client";

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
  const [pagesReadError, setPagesReadError] = useState<string | undefined>();
  const [loanError, setLoanError] = useState<string | undefined>();
  const [artistError, setArtistError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [movieItem, setMovieItem] = useState(item);

  useEffect(() => {
    setMovieItem(item);
  }, [item]);

  useEffect(() => {
    if (item.type !== "recipe" || item.cookbookId === null) return;
    let cancelled = false;
    void getCookbookUseCases().then(async (useCases) => {
      const cookbook = await useCases.getCookbook(item.cookbookId!);
      if (cancelled || cookbook === undefined) return;
      setValues((current) => {
        if ((current as RecipeFieldValues).cookbookQuery !== "") return current;
        return {
          ...(current as RecipeFieldValues),
          cookbookQuery: cookbook.title,
          cookbookAuthor: cookbook.author ?? "",
          cookbookIsbn: cookbook.isbn ?? "",
          sourceSectionOpen: true,
        };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [item.type, item.cookbookId, item.id]);

  const save = useCallback(async () => {
    const errors = validateFieldValues(item, values);
    if (errors.titleError || errors.artistError || errors.pagesReadError || errors.loanError) {
      setTitleError(errors.titleError);
      setPagesReadError(errors.pagesReadError);
      setLoanError(errors.loanError);
      setArtistError(errors.artistError);
      return;
    }
    setSaving(true);
    setTitleError(undefined);
    setPagesReadError(undefined);
    setLoanError(undefined);
    setArtistError(undefined);
    try {
      if (item.type === "recipe") {
        const recipeValues = values as RecipeFieldValues;
        const useCases = await getItemUseCases();
        const updated = await useCases.updateRecipe(
          item.id,
          recipeValuesToPatch(recipeValues),
          recipeSourcePayloadFromValues(recipeValues),
        );
        setValues(valuesFromItem(updated) as RecipeFieldValues);
        return;
      }
      const patch =
        item.type === "book"
          ? { ...patchFromValues(item, values), ...bookDiscoveryValuesToPatch(discoveryValues) }
          : patchFromValues(item, values);
      const updated = await onSave(patch);
      setValues(valuesFromItem(updated));
      if (updated.type === "movie") {
        setMovieItem(updated);
      }
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
        <BookDetailSections
          item={item as Item & { type: "book" }}
          values={values}
          discoveryValues={discoveryValues}
          onValuesChange={setValues}
          onDiscoveryChange={setDiscoveryValues}
          onSave={onSave}
          onLibraryChange={onLibraryChange}
          tagSuggestions={tagSuggestions}
          titleError={titleError}
          pagesReadError={pagesReadError}
          loanError={loanError}
          onClearTitleError={() => setTitleError(undefined)}
          onClearPagesReadError={() => setPagesReadError(undefined)}
          onClearLoanError={() => setLoanError(undefined)}
        />
      ) : null}
      {item.type === "movie" ? (
        <MovieDetailSections
          movieItem={movieItem as Item & { type: "movie" }}
          values={values}
          onValuesChange={setValues}
          onMovieItemChange={setMovieItem}
          onSave={onSave}
          tagSuggestions={tagSuggestions}
          titleError={titleError}
          onClearTitleError={() => setTitleError(undefined)}
        />
      ) : null}
      {item.type === "recipe" ? (
        <>
          <RecipeCookedActions itemId={item.id} />
          <RecipeFields
            values={values as RecipeFieldValues}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
            defaultSourceCollapsed={item.cookbookId === null}
          />
        </>
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
