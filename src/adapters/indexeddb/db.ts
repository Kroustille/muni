import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { BookQuote } from "../../domain/book-quote";
import type { MovieQuote } from "../../domain/movie-quote";
import type { StoredCatalogExercise } from "../../domain/fitness/catalog";
import type { FitnessProgram } from "../../domain/fitness/program";
import type {
  FitnessSkipRecord,
  FitnessUserSettings,
  FitnessWorkoutLog,
} from "../../domain/fitness/workout-log";
import type { Plant } from "../../domain/plant";
import type { PlantCareEvent } from "../../domain/plant-care-event";
import type { PlantCareProfile } from "../../domain/plant-care-profile";
import type { VegetableCulture } from "../../domain/vegetable-culture";
import type { VegetableMilestone } from "../../domain/vegetable-milestone";
import type { Item, ItemType } from "../../domain/item";
import type { MetaKey, MetaValues } from "../../application/ports/item-repository";
import type { DailyActivitySuggestionSnapshot } from "../../domain/activity-suggestion";
import type { Cookbook } from "../../domain/cookbook";

export interface MuniDbSchema extends DBSchema {
  items: {
    key: string;
    value: Item;
    indexes: { type: ItemType; updatedAt: string; deletedAt: string };
  };
  outbox: {
    key: string;
    value: { id: string };
  };
  bookQuotes: {
    key: string;
    value: BookQuote;
    indexes: { bookItemId: string };
  };
  quoteOutbox: {
    key: string;
    value: { id: string };
  };
  movieQuotes: {
    key: string;
    value: MovieQuote;
    indexes: { movieItemId: string };
  };
  movieQuoteOutbox: {
    key: string;
    value: { id: string };
  };
  meta: {
    key: MetaKey;
    value: MetaValues[MetaKey];
  };
  fitnessPrograms: {
    key: string;
    value: FitnessProgram;
  };
  fitnessWorkoutLogs: {
    key: string;
    value: FitnessWorkoutLog;
    indexes: { status: string; calendarDate: string };
  };
  fitnessSkipRecords: {
    key: string;
    value: FitnessSkipRecord;
  };
  fitnessUserSettings: {
    key: string;
    value: FitnessUserSettings;
  };
  fitnessExerciseCatalog: {
    key: string;
    value: StoredCatalogExercise;
  };
  fitnessProgramOutbox: { key: string; value: { id: string } };
  fitnessWorkoutOutbox: { key: string; value: { id: string } };
  fitnessSkipOutbox: { key: string; value: { id: string } };
  fitnessSettingsOutbox: { key: string; value: { id: string } };
  cookbooks: {
    key: string;
    value: Cookbook;
  };
  cookbookOutbox: {
    key: string;
    value: { id: string };
  };
  activity_suggestion_snapshot: {
    key: string;
    value: DailyActivitySuggestionSnapshot;
  };
  plants: { key: string; value: Plant };
  plantCareEvents: { key: string; value: PlantCareEvent; indexes: { plantId: string } };
  plantCareProfiles: { key: string; value: PlantCareProfile };
  vegetableCultures: { key: string; value: VegetableCulture };
  vegetableMilestones: { key: string; value: VegetableMilestone; indexes: { cultureId: string } };
  plantsOutbox: { key: string; value: { id: string } };
  plantCareEventOutbox: { key: string; value: { id: string } };
  plantCareProfileOutbox: { key: string; value: { id: string } };
  vegetableCultureOutbox: { key: string; value: { id: string } };
  vegetableMilestoneOutbox: { key: string; value: { id: string } };
}

export type MuniDb = IDBPDatabase<MuniDbSchema>;

const DB_VERSION = 7;

export function openMuniDb(name: string): Promise<MuniDb> {
  return openDB<MuniDbSchema>(name, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const items = db.createObjectStore("items", { keyPath: "id" });
        items.createIndex("type", "type");
        items.createIndex("updatedAt", "updatedAt");
        items.createIndex("deletedAt", "deletedAt");
        db.createObjectStore("outbox", { keyPath: "id" });
        db.createObjectStore("meta");
      }
      if (oldVersion < 2) {
        const quotes = db.createObjectStore("bookQuotes", { keyPath: "id" });
        quotes.createIndex("bookItemId", "bookItemId");
        db.createObjectStore("quoteOutbox", { keyPath: "id" });
      }
      if (oldVersion < 3) {
        const movieQuotes = db.createObjectStore("movieQuotes", { keyPath: "id" });
        movieQuotes.createIndex("movieItemId", "movieItemId");
        db.createObjectStore("movieQuoteOutbox", { keyPath: "id" });
      }
      if (oldVersion < 4) {
        db.createObjectStore("fitnessPrograms", { keyPath: "id" });
        const workouts = db.createObjectStore("fitnessWorkoutLogs", { keyPath: "id" });
        workouts.createIndex("status", "status");
        workouts.createIndex("calendarDate", "calendarDate");
        db.createObjectStore("fitnessSkipRecords", { keyPath: "id" });
        db.createObjectStore("fitnessUserSettings", { keyPath: "id" });
        db.createObjectStore("fitnessExerciseCatalog", { keyPath: "id" });
        db.createObjectStore("fitnessProgramOutbox", { keyPath: "id" });
        db.createObjectStore("fitnessWorkoutOutbox", { keyPath: "id" });
        db.createObjectStore("fitnessSkipOutbox", { keyPath: "id" });
        db.createObjectStore("fitnessSettingsOutbox", { keyPath: "id" });
      }
      if (oldVersion < 5) {
        db.createObjectStore("cookbooks", { keyPath: "id" });
        db.createObjectStore("cookbookOutbox", { keyPath: "id" });
      }
      if (oldVersion < 6) {
        db.createObjectStore("activity_suggestion_snapshot", { keyPath: "calendarDay" });
      }
      if (oldVersion < 7) {
        db.createObjectStore("plants", { keyPath: "id" });
        const careEvents = db.createObjectStore("plantCareEvents", { keyPath: "id" });
        careEvents.createIndex("plantId", "plantId");
        db.createObjectStore("plantCareProfiles", { keyPath: "id" });
        db.createObjectStore("vegetableCultures", { keyPath: "id" });
        const milestones = db.createObjectStore("vegetableMilestones", { keyPath: "id" });
        milestones.createIndex("cultureId", "cultureId");
        db.createObjectStore("plantsOutbox", { keyPath: "id" });
        db.createObjectStore("plantCareEventOutbox", { keyPath: "id" });
        db.createObjectStore("plantCareProfileOutbox", { keyPath: "id" });
        db.createObjectStore("vegetableCultureOutbox", { keyPath: "id" });
        db.createObjectStore("vegetableMilestoneOutbox", { keyPath: "id" });
      }
    },
  });
}
