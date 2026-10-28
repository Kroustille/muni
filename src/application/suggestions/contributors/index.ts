/**
 * Ordered stale contributors for activity suggestions (014).
 *
 * Registry order (tie-break): books → movies → music tracks → recipes → fitness →
 * music practice → plants. Adding a domain: create `*-stale-contributor.ts`, unit
 * tests, i18n kind labels, and append here — no change to `buildDailySuggestions`.
 */
import { booksStaleContributor } from "@/application/suggestions/contributors/books-stale-contributor";
import { fitnessStaleContributor } from "@/application/suggestions/contributors/fitness-stale-contributor";
import { moviesStaleContributor } from "@/application/suggestions/contributors/movies-stale-contributor";
import { musicPracticeStaleContributor } from "@/application/suggestions/contributors/music-practice-stale-contributor";
import { musicTracksStaleContributor } from "@/application/suggestions/contributors/music-tracks-stale-contributor";
import { plantsStaleContributor } from "@/application/suggestions/contributors/plants-stale-contributor";
import { recipesStaleContributor } from "@/application/suggestions/contributors/recipes-stale-contributor";
import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";

export type { ContributorContext, DomainStaleContributor } from "@/application/suggestions/contributors/shared";

export const allStaleContributors: readonly DomainStaleContributor[] = [
  booksStaleContributor,
  moviesStaleContributor,
  musicTracksStaleContributor,
  recipesStaleContributor,
  fitnessStaleContributor,
  musicPracticeStaleContributor,
  plantsStaleContributor,
];
