"use client";

import { useEffect, useState } from "react";
import type { MovieQuoteUseCases } from "@/application/movies/movie-quotes";
import type { Item, ItemPatch } from "@/domain/item";
import { MovieFields, type MovieFieldValues } from "@/components/fields";
import { MovieEpisodesSection } from "@/components/movies/movie-episodes-section";
import { MovieQuotesSection } from "@/components/movies/movie-quotes-section";
import { MovieReleaseReminder } from "@/components/movies/movie-release-reminder";
import { MovieStreamingSection } from "@/components/movies/movie-streaming-section";
import { getMovieQuoteUseCases } from "@/composition/client";
import { type FieldValues, valuesFromItem } from "./item-detail-shared";

export type MovieDetailSectionsProps = {
  movieItem: Item & { type: "movie" };
  values: FieldValues;
  onValuesChange: (next: FieldValues) => void;
  onMovieItemChange: (item: Item) => void;
  onSave: (patch: ItemPatch) => Promise<Item>;
  tagSuggestions?: readonly string[];
  titleError?: string;
  onClearTitleError: () => void;
};

export function MovieDetailSections({
  movieItem,
  values,
  onValuesChange,
  onMovieItemChange,
  onSave,
  tagSuggestions,
  titleError,
  onClearTitleError,
}: MovieDetailSectionsProps) {
  const [movieQuoteUseCases, setMovieQuoteUseCases] = useState<MovieQuoteUseCases | null>(null);

  useEffect(() => {
    void getMovieQuoteUseCases().then(setMovieQuoteUseCases);
  }, []);

  return (
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
          onValuesChange(next);
          onClearTitleError();
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
              onMovieItemChange(saved);
              onValuesChange(valuesFromItem(saved));
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
  );
}
