import type { Item, ItemPatch } from "@/domain/item";

export type BookWorkGroup = {
  groupKey: string;
  workId: string | null;
  items: Array<Item & { type: "book" }>;
};

function isBook(item: Item): item is Item & { type: "book" } {
  return item.type === "book";
}

function sortEditionItems(items: Array<Item & { type: "book" }>): Array<Item & { type: "book" }> {
  return [...items].sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

/** Groups list rows by shared \`workId\`; orphan editions stay one row each (FR-B07). */
export function groupBooksByWork(items: Item[]): BookWorkGroup[] {
  const books = items.filter(isBook);
  const seenWorkIds = new Set<string>();
  const groups: BookWorkGroup[] = [];

  for (const book of books) {
    if (book.workId) {
      if (seenWorkIds.has(book.workId)) continue;
      seenWorkIds.add(book.workId);
      const editions = sortEditionItems(books.filter((entry) => entry.workId === book.workId));
      groups.push({ groupKey: book.workId, workId: book.workId, items: editions });
      continue;
    }
    groups.push({
      groupKey: `orphan:${book.id}`,
      workId: null,
      items: [book],
    });
  }

  return groups;
}

export function normalizeOpenLibraryWorkKey(raw: string): string {
  return raw.replace(/^\/works\//, "").trim();
}

export function resolveWorkIdForLink(
  ...workIds: Array<string | null | undefined>
): string | null {
  const defined = workIds.filter((value): value is string => value !== null && value !== undefined);
  const catalog = defined.find((value) => !value.startsWith("local:"));
  if (catalog) return catalog;
  const local = defined.find((value) => value.startsWith("local:"));
  if (local) return local;
  return null;
}

export function resolveWorkIdForLinkWithNewLocal(
  workIds: Array<string | null | undefined>,
  newLocalId: string,
): string {
  return resolveWorkIdForLink(...workIds) ?? `local:${newLocalId}`;
}

export function workSiblings(library: Item[], item: Item & { type: "book" }): Array<Item & { type: "book" }> {
  if (!item.workId) return [];
  return library
    .filter(isBook)
    .filter((entry) => entry.id !== item.id && entry.workId === item.workId && entry.deletedAt === null);
}

export function canUnlinkWorkId(workId: string | null): boolean {
  return workId !== null && workId.startsWith("local:");
}

export type WorkLinkPatch = { id: string; patch: ItemPatch };

export function collectWorkLinkPatches(
  library: Item[],
  sourceId: string,
  targetId: string,
  newLocalId: string,
): WorkLinkPatch[] {
  const books = library.filter(isBook);
  const source = books.find((entry) => entry.id === sourceId);
  const target = books.find((entry) => entry.id === targetId);
  if (!source || !target || source.id === target.id) return [];

  const nextWorkId = resolveWorkIdForLinkWithNewLocal([source.workId, target.workId], newLocalId);
  const mergeKeys = new Set<string>();
  if (source.workId) mergeKeys.add(source.workId);
  if (target.workId) mergeKeys.add(target.workId);

  const affected = books.filter(
    (entry) => entry.id === sourceId || entry.id === targetId || (entry.workId && mergeKeys.has(entry.workId)),
  );

  return affected.map((entry) => ({
    id: entry.id,
    patch: { workId: nextWorkId },
  }));
}

export function patchForWorkUnlink(
  library: Item[],
  item: Item & { type: "book" },
): ItemPatch | null {
  if (!canUnlinkWorkId(item.workId)) return null;
  const siblings = workSiblings(library, item);
  if (siblings.length === 0) return null;
  return { workId: null };
}
