"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { BookQuoteUseCases } from "@/application/books/book-quotes";
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
import { BookQuotesSection } from "@/components/books/book-quotes-section";
import { MovieEpisodesSection } from "@/components/movies/movie-episodes-section";
import { MovieQuotesSection } from "@/components/movies/movie-quotes-section";
import { MovieReleaseReminder } from "@/components/movies/movie-release-reminder";
import { MovieStreamingSection } from "@/components/movies/movie-streaming-section";
import {
  getBookQuoteUseCases,
  getItemUseCases,
  getMovieQuoteUseCases,
} from "@/composition/client";
import type { MovieQuoteUseCases } from "@/application/movies/movie-quotes";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ExternalLinkActions } from "@/components/music/external-link-actions";
import { t } from "@/i18n";
import {
  bookLoanReturnPatch,
  clearBookLoanInValues,
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
  const [pagesReadError, setPagesReadError] = useState<string | undefined>();
  const [loanError, setLoanError] = useState<string | undefined>();
  const [artistError, setArtistError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [bookQuoteUseCases, setBookQuoteUseCases] = useState<BookQuoteUseCases | null>(null);
  const [movieQuoteUseCases, setMovieQuoteUseCases] = useState<MovieQuoteUseCases | null>(null);
  const [movieItem, setMovieItem] = useState(item);

  useEffect(() => {
    setMovieItem(item);
  }, [item]);

  useEffect(() => {
    if (item.type !== "book") return;
    void getBookQuoteUseCases().then(setBookQuoteUseCases);
  }, [item.type]);

  useEffect(() => {
    if (item.type !== "movie") return;
    void getMovieQuoteUseCases().then(setMovieQuoteUseCases);
  }, [item.type]);

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
        <>
          <BookFields
            values={values as BookFieldValues}
            pageCount={item.pageCount}
            tagSuggestions={tagSuggestions}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
              setPagesReadError(undefined);
            }}
            titleError={titleError}
            pagesReadError={pagesReadError}
          />
          <section className="flex flex-col gap-4 border-t border-border pt-4">
            <h2 className="text-base font-medium">{t("books.loan.title")}</h2>
            <TextField
              label={t("books.loan.to")}
              value={(values as BookFieldValues).loanedTo}
              onChange={(event) => {
                setValues({ ...(values as BookFieldValues), loanedTo: event.target.value });
                setLoanError(undefined);
              }}
              error={loanError}
              autoComplete="off"
            />
            <TextField
              label={t("books.loan.since")}
              type="date"
              value={(values as BookFieldValues).loanedAt}
              onChange={(event) => {
                setValues({ ...(values as BookFieldValues), loanedAt: event.target.value });
                setLoanError(undefined);
              }}
              autoComplete="off"
            />
            {(values as BookFieldValues).loanedTo.trim() !== "" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setValues(clearBookLoanInValues(values as BookFieldValues));
                  void onSave(bookLoanReturnPatch()).then((updated) => {
                    setValues(valuesFromItem(updated));
                  });
                }}
              >
                {t("books.loan.return")}
              </Button>
            ) : null}
          </section>
          <BookEditionsSection
            item={item as Item & { type: "book" }}
            onChanged={async () => {
              const useCases = await getItemUseCases();
              const refreshed = await useCases.getItem(item.id);
              if (refreshed) setValues(valuesFromItem(refreshed));
              onLibraryChange?.();
            }}
          />
          {bookQuoteUseCases !== null ? (
            <BookQuotesSection bookItemId={item.id} useCases={bookQuoteUseCases} />
          ) : null}
          <BookDiscoveryFields values={discoveryValues} onChange={setDiscoveryValues} />
        </>
      ) : null}
      {item.type === "movie" ? (
        <>
          <MovieFields
            values={values as MovieFieldValues}
            mediaKind={movieItem.mediaKind}
            catalogRating={movieItem.catalogRating}
            imdbId={movieItem.imdbId}
            director={movieItem.director}
            cast={movieItem.cast}
            tagSuggestions={tagSuggestions}
            onChange={(next) => {
              setValues(next);
              setTitleError(undefined);
            }}
            titleError={titleError}
          />
          {movieItem.mediaKind === "series" ? (
            <>
              <MovieEpisodesSection
                item={movieItem as Item & { type: "movie"; mediaKind: "series" }}
                onEpisodeChange={async (updated) => {
                  const saved = await onSave({
                    episodeProgress: updated.episodeProgress,
                    nextEpisodeKey: updated.nextEpisodeKey,
                  });
                  setMovieItem(saved);
                  setValues(valuesFromItem(saved));
                }}
              />
              <MovieReleaseReminder movieItemId={movieItem.id} title={movieItem.title} />
            </>
          ) : null}
          <MovieStreamingSection imdbId={movieItem.imdbId} />
          {movieQuoteUseCases !== null ? (
            <MovieQuotesSection movieItemId={movieItem.id} useCases={movieQuoteUseCases} />
          ) : null}
        </>
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
