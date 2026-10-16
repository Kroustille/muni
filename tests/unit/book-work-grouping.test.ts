import { describe, expect, it } from "vitest";

import { newItem } from "@/domain/item";
import {
  canUnlinkWorkId,
  collectWorkLinkPatches,
  groupBooksByWork,
  resolveWorkIdForLink,
  workSiblings,
} from "@/application/books/work-grouping";

const T0 = "2026-01-01T10:00:00.000Z";

function book(
  id: string,
  overrides: {
    title?: string;
    workId?: string | null;
    isbn?: string | null;
    createdAt?: string;
  } = {},
) {
  return newItem({
    id,
    type: "book",
    title: overrides.title ?? `Book ${id}`,
    createdAt: overrides.createdAt ?? T0,
    workId: overrides.workId ?? null,
    isbn: overrides.isbn ?? null,
  });
}

describe("groupBooksByWork", () => {
  it("groups editions sharing a catalog work id (catalogWorkId)", () => {
    const a = book("a", { workId: "OL45804W", title: "Édition A", isbn: "9780000000001" });
    const b = book("b", { workId: "OL45804W", title: "Édition B", isbn: "9780000000002" });
    const orphan = book("c", { title: "Seul" });

    const groups = groupBooksByWork([a, b, orphan]);
    expect(groups).toHaveLength(2);
    const catalogGroup = groups.find((g) => g.workId === "OL45804W");
    expect(catalogGroup?.items.map((item) => item.id).sort()).toEqual(["a", "b"]);
    const solo = groups.find((g) => g.workId === null);
    expect(solo?.items).toEqual([orphan]);
  });

  it("groups editions sharing a manual local work key (workKey)", () => {
    const local = "local:abc-123";
    const a = book("a", { workId: local });
    const b = book("b", { workId: local });
    const groups = groupBooksByWork([a, b]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.groupKey).toBe(local);
    expect(groups[0]?.items).toHaveLength(2);
  });

  it("keeps orphan editions as single-item groups in list order", () => {
    const first = book("1", { title: "First", createdAt: "2026-01-02T00:00:00.000Z" });
    const second = book("2", { title: "Second", createdAt: "2026-01-03T00:00:00.000Z" });
    const groups = groupBooksByWork([first, second]);
    expect(groups.map((g) => g.items[0]?.id)).toEqual(["1", "2"]);
    expect(groups.every((g) => g.workId === null && g.items.length === 1)).toBe(true);
  });
});

describe("resolveWorkIdForLink", () => {
  it("prefers Open Library work id over local keys", () => {
    expect(resolveWorkIdForLink("OL99W", "local:x", "new")).toBe("OL99W");
    expect(resolveWorkIdForLink(null, "OL99W", "new")).toBe("OL99W");
  });

  it("reuses an existing local work key when linking orphans", () => {
    expect(resolveWorkIdForLink("local:keep", null, "new")).toBe("local:keep");
    expect(resolveWorkIdForLink(null, null, "fresh-id")).toBe("local:fresh-id");
  });
});

describe("collectWorkLinkPatches", () => {
  it("assigns the resolved work id to every member of merged groups", () => {
    const localA = "local:group-a";
    const localB = "local:group-b";
    const lib = [
      book("a1", { workId: localA }),
      book("a2", { workId: localA }),
      book("b1", { workId: localB }),
      book("target", { workId: "OL100W" }),
    ];
    const patches = collectWorkLinkPatches(lib, "a1", "target", "ignored");
    const byId = new Map(patches.map((p) => [p.id, p.patch.workId]));
    expect(byId.get("a1")).toBe("OL100W");
    expect(byId.get("a2")).toBe("OL100W");
    expect(byId.get("target")).toBe("OL100W");
    expect(byId.get("b1")).toBeUndefined();
  });
});

describe("workSiblings and unlink rules", () => {
  it("lists other editions in the same work group", () => {
    const a = book("a", { workId: "OL1W" });
    const b = book("b", { workId: "OL1W" });
    const c = book("c", { workId: null });
    expect(workSiblings([a, b, c], a).map((i) => i.id)).toEqual(["b"]);
  });

  it("allows unlink only for local work keys with remaining siblings", () => {
    expect(canUnlinkWorkId("local:abc")).toBe(true);
    expect(canUnlinkWorkId("OL45804W")).toBe(false);
    expect(canUnlinkWorkId(null)).toBe(false);
  });
});
