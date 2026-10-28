import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BookQuote } from "../../domain/book-quote";
import type { LearningPiece } from "../../domain/learning-piece";
import type { MusicComposition } from "../../domain/music-composition";
import type { DjSet } from "../../domain/dj-set";
import type { PracticeExercise } from "../../domain/practice-exercise";
import type { PracticeInstrument } from "../../domain/practice-instrument";
import type { PracticeLog } from "../../domain/practice-log";
import type { PracticePlan } from "../../domain/practice-plan";
import type { MovieQuote } from "../../domain/movie-quote";
import type { StoredCatalogExercise } from "../../domain/fitness/catalog";
import type { FitnessSessionTemplate } from "../../domain/fitness/session-template";
import type { FitnessScheduledSession } from "../../domain/fitness/scheduled-session";
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
  fitnessSessionTemplates: {
    key: string;
    value: FitnessSessionTemplate;
  };
  fitnessScheduledSessions: {
    key: string;
    value: FitnessScheduledSession;
    indexes: { calendarDate: string };
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
  fitnessSessionTemplateOutbox: { key: string; value: { id: string } };
  fitnessScheduledSessionOutbox: { key: string; value: { id: string } };
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
  musicPracticeCompositions: { key: string; value: MusicComposition };
  musicPracticeDjSets: { key: string; value: DjSet };
  musicPracticeInstruments: { key: string; value: PracticeInstrument };
  musicPracticeExercises: { key: string; value: PracticeExercise };
  musicPracticePlans: { key: string; value: PracticePlan };
  musicPracticeLogs: { key: string; value: PracticeLog };
  musicPracticeLearningPieces: { key: string; value: LearningPiece };
  musicPracticeCompositionOutbox: { key: string; value: { id: string } };
  musicPracticeDjSetOutbox: { key: string; value: { id: string } };
  musicPracticeInstrumentOutbox: { key: string; value: { id: string } };
  musicPracticeExerciseOutbox: { key: string; value: { id: string } };
  musicPracticePlanOutbox: { key: string; value: { id: string } };
  musicPracticeLogOutbox: { key: string; value: { id: string } };
  musicPracticeLearningPieceOutbox: { key: string; value: { id: string } };
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

const DB_VERSION = 9;

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
        const legacyDb = db as unknown as IDBPDatabase<Record<string, unknown>>;
        legacyDb.createObjectStore("fitnessPrograms", { keyPath: "id" });
        const workouts = legacyDb.createObjectStore("fitnessWorkoutLogs", { keyPath: "id" });
        workouts.createIndex("status", "status");
        workouts.createIndex("calendarDate", "calendarDate");
        legacyDb.createObjectStore("fitnessSkipRecords", { keyPath: "id" });
        legacyDb.createObjectStore("fitnessUserSettings", { keyPath: "id" });
        legacyDb.createObjectStore("fitnessExerciseCatalog", { keyPath: "id" });
        legacyDb.createObjectStore("fitnessProgramOutbox", { keyPath: "id" });
        legacyDb.createObjectStore("fitnessWorkoutOutbox", { keyPath: "id" });
        legacyDb.createObjectStore("fitnessSkipOutbox", { keyPath: "id" });
        legacyDb.createObjectStore("fitnessSettingsOutbox", { keyPath: "id" });
      }
      if (oldVersion < 5) {
        db.createObjectStore("cookbooks", { keyPath: "id" });
        db.createObjectStore("cookbookOutbox", { keyPath: "id" });
      }
      if (oldVersion < 6) {
        db.createObjectStore("activity_suggestion_snapshot", { keyPath: "calendarDay" });
      }
      if (oldVersion < 7) {
        db.createObjectStore("musicPracticeCompositions", { keyPath: "id" });
        db.createObjectStore("musicPracticeDjSets", { keyPath: "id" });
        db.createObjectStore("musicPracticeInstruments", { keyPath: "id" });
        db.createObjectStore("musicPracticeExercises", { keyPath: "id" });
        db.createObjectStore("musicPracticePlans", { keyPath: "id" });
        db.createObjectStore("musicPracticeLogs", { keyPath: "id" });
        db.createObjectStore("musicPracticeLearningPieces", { keyPath: "id" });
        db.createObjectStore("musicPracticeCompositionOutbox", { keyPath: "id" });
        db.createObjectStore("musicPracticeDjSetOutbox", { keyPath: "id" });
        db.createObjectStore("musicPracticeInstrumentOutbox", { keyPath: "id" });
        db.createObjectStore("musicPracticeExerciseOutbox", { keyPath: "id" });
        db.createObjectStore("musicPracticePlanOutbox", { keyPath: "id" });
        db.createObjectStore("musicPracticeLogOutbox", { keyPath: "id" });
        db.createObjectStore("musicPracticeLearningPieceOutbox", { keyPath: "id" });
      }
      if (oldVersion < 8) {
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
      if (oldVersion < 9) {
        const legacyDb = db as unknown as IDBPDatabase<Record<string, unknown>>;
        for (const name of [
          "fitnessPrograms",
          "fitnessProgramOutbox",
          "fitnessWorkoutLogs",
          "fitnessWorkoutOutbox",
          "fitnessSkipRecords",
          "fitnessSkipOutbox",
        ]) {
          if (legacyDb.objectStoreNames.contains(name)) legacyDb.deleteObjectStore(name);
        }
        db.createObjectStore("fitnessSessionTemplates", { keyPath: "id" });
        const scheduled = db.createObjectStore("fitnessScheduledSessions", { keyPath: "id" });
        scheduled.createIndex("calendarDate", "calendarDate");
        const workouts = db.createObjectStore("fitnessWorkoutLogs", { keyPath: "id" });
        workouts.createIndex("status", "status");
        workouts.createIndex("calendarDate", "calendarDate");
        db.createObjectStore("fitnessSkipRecords", { keyPath: "id" });
        db.createObjectStore("fitnessSessionTemplateOutbox", { keyPath: "id" });
        db.createObjectStore("fitnessScheduledSessionOutbox", { keyPath: "id" });
        db.createObjectStore("fitnessWorkoutOutbox", { keyPath: "id" });
        db.createObjectStore("fitnessSkipOutbox", { keyPath: "id" });
      }
    },
  });
}
