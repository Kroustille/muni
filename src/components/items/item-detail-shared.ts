import type { Item, ItemPatch } from "@/domain/item";
import {
  type BookFieldValues,
  type MovieFieldValues,
  type MusicArtistFieldValues,
  musicArtistFieldValuesToExtra,
  type MusicTrackFieldValues,
  musicTrackFieldValuesToExtra,
  type RecipeFieldValues,
  type ShoppingFieldValues,
} from "@/components/fields";
import { t } from "@/i18n";

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function itemToShoppingValues(item: Item): ShoppingFieldValues {
  return {
    title: item.title,
    quantity: item.quantity ?? "",
  };
}

export function shoppingValuesToPatch(values: ShoppingFieldValues): ItemPatch {
  return {
    title: values.title.trim(),
    quantity: optionalText(values.quantity),
  };
}

export function itemToBookValues(item: Item): BookFieldValues {
  return {
    title: item.title,
    author: item.author ?? "",
    status: item.status as BookFieldValues["status"],
    rating: item.rating,
    recommendedBy: item.recommendedBy ?? "",
    notes: item.notes ?? "",
    tags: item.tags ? [...item.tags] : [],
    seriesName: item.seriesName ?? "",
    seriesPosition:
      item.seriesPosition !== null && item.seriesPosition !== undefined
        ? String(item.seriesPosition)
        : "",
  };
}

export function bookValuesToPatch(values: BookFieldValues): ItemPatch {
  const patch: ItemPatch = {
    title: values.title.trim(),
    author: optionalText(values.author),
    status: values.status,
    recommendedBy: optionalText(values.recommendedBy),
    notes: optionalText(values.notes),
  };
  if (values.status === "read") {
    patch.rating = values.rating;
  }
  const tags = values.tags.map((tag) => tag.trim()).filter((tag) => tag !== "");
  patch.tags = tags.length === 0 ? null : tags;
  patch.seriesName = optionalText(values.seriesName);
  const positionRaw = values.seriesPosition.trim();
  if (positionRaw === "") {
    patch.seriesPosition = null;
  } else {
    const position = Number(positionRaw);
    if (!Number.isNaN(position)) patch.seriesPosition = position;
  }
  return patch;
}

export function itemToMovieValues(item: Item): MovieFieldValues {
  return {
    title: item.title,
    status: item.status as MovieFieldValues["status"],
    rating: item.rating,
    recommendedBy: item.recommendedBy ?? "",
    notes: item.notes ?? "",
  };
}

export function movieValuesToPatch(values: MovieFieldValues): ItemPatch {
  const patch: ItemPatch = {
    title: values.title.trim(),
    status: values.status,
    recommendedBy: optionalText(values.recommendedBy),
    notes: optionalText(values.notes),
  };
  if (values.status === "watched") {
    patch.rating = values.rating;
  }
  return patch;
}

export function itemToRecipeValues(item: Item): RecipeFieldValues {
  return {
    title: item.title,
    ingredients: item.ingredients ?? [],
    steps: item.steps ?? [],
    notes: item.notes ?? "",
  };
}

export function itemToMusicArtistValues(item: Item): MusicArtistFieldValues {
  return {
    title: item.title,
    rating: item.rating,
    recommendedBy: item.recommendedBy ?? "",
    notes: item.notes ?? "",
    spotifyUrl: item.spotifyUrl ?? "",
    soundcloudUrl: item.soundcloudUrl ?? "",
  };
}

export function musicArtistValuesToPatch(values: MusicArtistFieldValues): ItemPatch {
  return musicArtistFieldValuesToExtra(values) as ItemPatch;
}

export function itemToMusicTrackValues(item: Item): MusicTrackFieldValues {
  return {
    title: item.title,
    artist: item.artist ?? "",
    album: item.album ?? "",
    releaseYear: item.releaseYear !== null ? String(item.releaseYear) : "",
    status: (item.status ?? "to_listen") as MusicTrackFieldValues["status"],
    rating: item.rating,
    recommendedBy: item.recommendedBy ?? "",
    notes: item.notes ?? "",
    spotifyUrl: item.spotifyUrl ?? "",
    soundcloudUrl: item.soundcloudUrl ?? "",
  };
}

export function musicTrackValuesToPatch(values: MusicTrackFieldValues): ItemPatch {
  return {
    ...musicTrackFieldValuesToExtra(values),
    title: values.title.trim(),
  };
}

export function recipeValuesToPatch(values: RecipeFieldValues): ItemPatch {
  const ingredients = values.ingredients
    .map((row) => ({ quantity: row.quantity.trim(), name: row.name.trim() }))
    .filter((row) => row.quantity !== "" || row.name !== "");
  const steps = values.steps.map((step) => step.trim()).filter((step) => step !== "");
  return {
    title: values.title.trim(),
    notes: optionalText(values.notes),
    ingredients: ingredients.length === 0 ? null : ingredients,
    steps: steps.length === 0 ? null : steps,
  };
}

export type FieldValues =
  | ShoppingFieldValues
  | BookFieldValues
  | MovieFieldValues
  | MusicArtistFieldValues
  | MusicTrackFieldValues
  | RecipeFieldValues;

export function valuesFromItem(item: Item): FieldValues {
  switch (item.type) {
    case "shopping":
      return itemToShoppingValues(item);
    case "book":
      return itemToBookValues(item);
    case "movie":
      return itemToMovieValues(item);
    case "recipe":
      return itemToRecipeValues(item);
    case "music_artist":
      return itemToMusicArtistValues(item);
    case "music_track":
      return itemToMusicTrackValues(item);
  }
}

export function patchFromValues(item: Item, values: FieldValues): ItemPatch {
  switch (item.type) {
    case "shopping":
      return shoppingValuesToPatch(values as ShoppingFieldValues);
    case "book":
      return bookValuesToPatch(values as BookFieldValues);
    case "movie":
      return movieValuesToPatch(values as MovieFieldValues);
    case "recipe":
      return recipeValuesToPatch(values as RecipeFieldValues);
    case "music_artist":
      return {
        ...musicArtistValuesToPatch(values as MusicArtistFieldValues),
        title: values.title.trim(),
      };
    case "music_track":
      return musicTrackValuesToPatch(values as MusicTrackFieldValues);
  }
}

export function validateFieldValues(
  item: Item,
  values: FieldValues,
): { titleError?: string; artistError?: string } {
  const trimmedTitle = values.title.trim();
  if (!trimmedTitle) {
    return { titleError: t("validation.titleRequired") };
  }
  if (item.type === "music_track") {
    const artist = (values as MusicTrackFieldValues).artist.trim();
    if (!artist) {
      return { artistError: t("validation.artistRequired") };
    }
  }
  return {};
}
