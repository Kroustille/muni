import { describe, expect, it } from "vitest";

import type { ActivitySuggestionCandidate } from "@/domain/activity-suggestion";
import {
  compareCandidates,
  pickSuggestionPair,
  sortCandidates,
} from "@/application/suggestions/select-pair";

function candidate(
  partial: Partial<ActivitySuggestionCandidate> &
    Pick<ActivitySuggestionCandidate, "domainId" | "itemId" | "title">,
): ActivitySuggestionCandidate {
  return {
    kind: "resume_reading",
    subtitle: null,
    staleAnchorDate: "2026-01-01",
    score: 10,
    deepLink: "/items/x",
    primaryActionKey: "suggestions.action.open",
    ...partial,
  };
}

describe("selection algorithm (014)", () => {
  it("sorts candidates by score descending", () => {
    const pool = [
      candidate({ domainId: "book", itemId: "a", title: "A", score: 5 }),
      candidate({ domainId: "movie", itemId: "b", title: "B", score: 40 }),
      candidate({ domainId: "recipe", itemId: "c", title: "C", score: 20 }),
    ];
    const sorted = sortCandidates(pool);
    expect(sorted.map((c) => c.itemId)).toEqual(["b", "c", "a"]);
  });

  it("prefers two different domains when the pool spans at least two domains", () => {
    const pool = [
      candidate({ domainId: "book", itemId: "book-1", title: "Livre", score: 50 }),
      candidate({ domainId: "movie", itemId: "movie-1", title: "Film", score: 45 }),
      candidate({ domainId: "book", itemId: "book-2", title: "Autre livre", score: 44 }),
    ];
    const { first, second } = pickSuggestionPair(pool);
    expect(first?.domainId).toBe("book");
    expect(first?.itemId).toBe("book-1");
    expect(second?.domainId).toBe("movie");
    expect(second?.domainId).not.toBe(first?.domainId);
  });

  it("keeps at most one fitness candidate — highest score wins", () => {
    const pool = [
      candidate({
        domainId: "fitness",
        itemId: "fit-low",
        title: "Low",
        score: 10,
        kind: "resume_training",
      }),
      candidate({
        domainId: "fitness",
        itemId: "fit-high",
        title: "High",
        score: 30,
        kind: "unblock_skipped",
      }),
      candidate({ domainId: "book", itemId: "book-1", title: "Livre", score: 5 }),
    ];
    const sorted = sortCandidates(pool);
    const fitnessIds = sorted.filter((c) => c.domainId === "fitness").map((c) => c.itemId);
    expect(fitnessIds).toEqual(["fit-high"]);
  });

  it("tie-breaks equal scores by domain priority then French title", () => {
    const plants = candidate({
      domainId: "plants",
      itemId: "p1",
      title: "Zzz",
      score: 20,
      kind: "water_plant",
    });
    const book = candidate({
      domainId: "book",
      itemId: "b1",
      title: "Aaa",
      score: 20,
    });
    expect(compareCandidates(plants, book)).toBeLessThan(0);

    const bookA = candidate({ domainId: "book", itemId: "b2", title: "Élan", score: 20 });
    const bookB = candidate({ domainId: "book", itemId: "b3", title: "Zèbre", score: 20 });
    expect(compareCandidates(bookA, bookB)).toBeLessThan(0);
  });
});
