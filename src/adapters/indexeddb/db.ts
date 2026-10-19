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
import type { Item, ItemType } from "../../domain/item";
import type { MetaKey, MetaValues } from "../../application/ports/item-repository";

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
}

export type MuniDb = IDBPDatabase<MuniDbSchema>;

const DB_VERSION = 4;

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
    },
  });
}
