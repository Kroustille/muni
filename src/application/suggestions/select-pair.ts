import type { ActivitySuggestionCandidate, SuggestionDomainId } from "@/domain/activity-suggestion";

/** Tie-break domain priority (lower index = higher priority when scores tie). */
export const DOMAIN_PRIORITY: readonly SuggestionDomainId[] = [
  "plants",
  "fitness",
  "recipe",
  "music_practice",
  "book",
  "movie",
  "music_track",
];

function domainPriorityIndex(domainId: SuggestionDomainId): number {
  const index = DOMAIN_PRIORITY.indexOf(domainId);
  return index === -1 ? DOMAIN_PRIORITY.length : index;
}

export function compareCandidates(
  a: ActivitySuggestionCandidate,
  b: ActivitySuggestionCandidate,
): number {
  if (b.score !== a.score) return b.score - a.score;
  const pd = domainPriorityIndex(a.domainId) - domainPriorityIndex(b.domainId);
  if (pd !== 0) return pd;
  return a.title.localeCompare(b.title, "fr");
}

/** At most one fitness candidate — keep highest score. */
export function applyFitnessPoolCap(
  candidates: ActivitySuggestionCandidate[],
): ActivitySuggestionCandidate[] {
  const fitness = candidates.filter((c) => c.domainId === "fitness");
  if (fitness.length <= 1) return candidates;
  fitness.sort(compareCandidates);
  const keep = fitness[0]!;
  return candidates.filter((c) => c.domainId !== "fitness" || c.itemId === keep.itemId);
}

export function sortCandidates(
  candidates: ActivitySuggestionCandidate[],
): ActivitySuggestionCandidate[] {
  return applyFitnessPoolCap([...candidates]).sort(compareCandidates);
}

export type SuggestionPair = {
  first: ActivitySuggestionCandidate | null;
  second: ActivitySuggestionCandidate | null;
};

export function pickSuggestionPair(
  pool: ActivitySuggestionCandidate[],
): SuggestionPair {
  const sorted = sortCandidates(pool);
  if (sorted.length === 0) {
    return { first: null, second: null };
  }

  const first = sorted[0]!;
  const domainsInPool = new Set(sorted.map((c) => c.domainId));

  if (domainsInPool.size >= 2) {
    const second =
      sorted.find((c) => c.itemId !== first.itemId && c.domainId !== first.domainId) ?? null;
    return { first, second };
  }

  const second = sorted.find((c) => c.itemId !== first.itemId) ?? null;
  return { first, second };
}

export function pickCandidatesForSlots(
  pool: ActivitySuggestionCandidate[],
  slotCount: number,
  excludeItemIds: ReadonlySet<string>,
): ActivitySuggestionCandidate[] {
  const filtered = pool.filter((c) => !excludeItemIds.has(c.itemId));
  const { first, second } = pickSuggestionPair(filtered);
  const picks: ActivitySuggestionCandidate[] = [];
  if (first) picks.push(first);
  if (second && slotCount > 1) picks.push(second);
  return picks.slice(0, slotCount);
}