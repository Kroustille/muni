import { describe, expect, it } from "vitest";

import { newItem } from "@/domain/item";
import {
  canUnlinkWorkId,
  collectWorkLinkPatches,
  groupBooksByWork,
  resolveWorkIdForLink,
  resolveWorkIdForLinkWithNewLocal,
  workSiblings,
} from "@/application/books/work-grouping";

const T0 = "2026-01-01T10:00:00.000Z";

function bookId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function book(
  n: number,
  overrides: {
    title?: string;
    workId?: string | null;
    isbn?: string | null;
    createdAt?: string;
  } = {},
) {
  return newItem({
    id: bookId(n),
    type: "book",
    title: overrides.title ?? `Book ${n}`,
    createdAt: overrides.createdAt ?? T0,
    workId: overrides.workId ?? null,
    isbn: overrides.isbn ?? null,
  });
}

describe("groupBooksByWork", () => {
  it("groups editions sharing a catalog work id (catalogWorkId)", () => {
    const a = book(1, { workId: "OL45804W", title: "Édition A", isbn: "9782070368228" });
    const b = book(2, { workId: "OL45804W", title: "Édition B", isbn: "9782070612758" });
    const orphan = book(3, { title: "Seul" });

    const groups = groupBooksByWork([a, b, orphan]);
    expect(groups).toHaveLength(2);
    const catalogGroup = groups.find((g) => g.workId === "OL45804W");
    expect(catalogGroup?.items.map((item) => item.id).sort()).toEqual([bookId(1), bookId(2)]);
    const solo = groups.find((g) => g.workId === null);
    expect(solo?.items).toEqual([orphan]);
  });

  it("groups editions sharing a manual local work key (workKey)", () => {
    const local = "local:abc-123";
    const a = book(1, { workId: local });
    const b = book(2, { workId: local });
    const groups = groupBooksByWork([a, b]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.groupKey).toBe(local);
    expect(groups[0]?.items).toHaveLength(2);
  });

  it("keeps orphan editions as single-item groups in list order", () => {
    const first = book(1, { title: "First", createdAt: "2026-01-02T00:00:00.000Z" });
    const second = book(2, { title: "Second", createdAt: "2026-01-03T00:00:00.000Z" });
    const groups = groupBooksByWork([first, second]);
    expect(groups.map((g) => g.items[0]?.id)).toEqual([bookId(1), bookId(2)]);
    expect(groups.every((g) => g.workId === null && g.items.length === 1)).toBe(true);
  });
});

describe("resolveWorkIdForLink", () => {
  it("prefers Open Library work id over local keys", () => {
    expect(resolveWorkIdForLink("OL99W", "local:x", "new")).toBe("OL99W");
    expect(resolveWorkIdForLink(null, "OL99W", "new")).toBe("OL99W");
  });

  it("reuses an existing local work key when linking orphans", () => {
    expect(resolveWorkIdForLink("local:keep", null)).toBe("local:keep");
    expect(resolveWorkIdForLinkWithNewLocal([null, null], "fresh-id")).toBe("local:fresh-id");
  });
});

describe("collectWorkLinkPatches", () => {
  it("assigns the resolved work id to every member of merged groups", () => {
    const localA = "local:group-a";
    const localB = "local:group-b";
    const a1 = book(1, { workId: localA });
    const a2 = book(2, { workId: localA });
    const b1 = book(3, { workId: localB });
    const target = book(4, { workId: "OL100W" });
    const lib = [a1, a2, b1, target];
    const patches = collectWorkLinkPatches(lib, a1.id, target.id, "ignored");
    const byId = new Map(patches.map((p) => [p.id, p.patch.workId]));
    expect(byId.get(a1.id)).toBe("OL100W");
    expect(byId.get(a2.id)).toBe("OL100W");
    expect(byId.get(target.id)).toBe("OL100W");
    expect(byId.get(b1.id)).toBeUndefined();
  });
});

describe("workSiblings and unlink rules", () => {
  it("lists other editions in the same work group", () => {
    const a = book(1, { workId: "OL1W" });
    const b = book(2, { workId: "OL1W" });
    const c = book(3, { workId: null });
    expect(workSiblings([a, b, c], a).map((i) => i.id)).toEqual([b.id]);
  });

  it("allows unlink only for local work keys with remaining siblings", () => {
    expect(canUnlinkWorkId("local:abc")).toBe(true);
    expect(canUnlinkWorkId("OL45804W")).toBe(false);
    expect(canUnlinkWorkId(null)).toBe(false);
  });
});
