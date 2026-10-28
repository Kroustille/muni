/**
 * Domain recap contributors — register new domains here without changing the snapshot orchestrator.
 *
 * Order MUST match `RECAP_DOMAIN_IDS` in `@/domain/recap`. Musique merges `musicTracksRecapContributor`
 * and `musicPracticeRecapContributor` (both emit `domainId: "music_track"`).
 *
 * @example
 * export const myDomainContributor: DomainRecapContributor = { domainId: "book", ... };
 */
import { booksRecapContributor } from "./books-contributor";
import { fitnessRecapContributor } from "./fitness-contributor";
import { moviesRecapContributor } from "./movies-contributor";
import { musicPracticeRecapContributor } from "./music-practice-contributor";
import { musicTracksRecapContributor } from "./music-tracks-contributor";
import { plantsRecapContributor } from "./plants-contributor";
import { recipesRecapContributor } from "./recipes-contributor";
import type { DomainRecapContributor } from "@/application/recap/contributor-types";

export type { DomainRecapContributor };

export const RECAP_CONTRIBUTORS: DomainRecapContributor[] = [
  booksRecapContributor,
  moviesRecapContributor,
  musicTracksRecapContributor,
  musicPracticeRecapContributor,
  recipesRecapContributor,
  fitnessRecapContributor,
  plantsRecapContributor,
];
