import type { Migration, MigrationProvider } from "kysely/migration";

import * as m0001Auth from "./0001_auth";
import * as m0002Items from "./0002_items";
import * as m0003BookCatalogFields from "./0003_book_catalog_fields";
import * as m0004CatalogCache from "./0004_catalog_cache";
import * as m0005MovieCatalogFields from "./0005_movie_catalog_fields";
import * as m0006MusicItemTypes from "./0006_music_item_types";
import * as m0007MusicArtistRating from "./0007_music_artist_rating";
import * as m0008BookLibraryFields from "./0008_book_library_fields";
import * as m0009BookQuotes from "./0009_book_quotes";
import * as m0010UserReadingSettings from "./0010_user_reading_settings";
import * as m0011MovieLibraryFields from "./0011_movie_library_fields";
import * as m0012MovieQuotes from "./0012_movie_quotes";
import * as m0013UserWatchSettings from "./0013_user_watch_settings";
import * as m0014FitnessTables from "./0014_fitness_tables";
import * as m0015CookbooksAndRecipeSource from "./0015_cookbooks_and_recipe_source";
import * as m0016RecipeCookedDates from "./0016_recipe_cooked_dates";

// Static registry: add each migration module here, keyed by its sortable name.
const migrations: Record<string, Migration> = {
  "0001_auth": m0001Auth,
  "0002_items": m0002Items,
  "0003_book_catalog_fields": m0003BookCatalogFields,
  "0004_catalog_cache": m0004CatalogCache,
  "0005_movie_catalog_fields": m0005MovieCatalogFields,
  "0006_music_item_types": m0006MusicItemTypes,
  "0007_music_artist_rating": m0007MusicArtistRating,
  "0008_book_library_fields": m0008BookLibraryFields,
  "0009_book_quotes": m0009BookQuotes,
  "0010_user_reading_settings": m0010UserReadingSettings,
  "0011_movie_library_fields": m0011MovieLibraryFields,
  "0012_movie_quotes": m0012MovieQuotes,
  "0013_user_watch_settings": m0013UserWatchSettings,
  "0014_fitness_tables": m0014FitnessTables,
  "0015_cookbooks_and_recipe_source": m0015CookbooksAndRecipeSource,
  "0016_recipe_cooked_dates": m0016RecipeCookedDates,
};

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
