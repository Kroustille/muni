import type { Item } from "@/domain/item";
import { normalizeText } from "@/domain/text";

function searchableFields(item: Item): string[] {
  const fields = [item.title];
  switch (item.type) {
    case "book":
      if (item.author) fields.push(item.author);
      break;
    case "movie":
      if (item.director) fields.push(item.director);
      break;
    case "music_track":
      if (item.artist) fields.push(item.artist);
      break;
    default:
      break;
  }
  return fields;
}

/** Client-side filter for the current list page (FR-001–FR-007). */
export function filterItemsForListLocalSearch(items: readonly Item[], query: string): Item[] {
  const trimmed = query.trim();
  if (trimmed === "") return [...items];
  const normalizedQuery = normalizeText(trimmed);
  return items.filter((item) =>
    searchableFields(item).some((field) => normalizeText(field).includes(normalizedQuery)),
  );
}
