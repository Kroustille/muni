import type { Item } from "@/domain/item";

export type AssignBooksToSeriesInput = {
  books: readonly Item[];
  ids: readonly string[];
  seriesName: string;
  seriesPosition: number;
};

export type AssignBooksToSeriesResult = {
  patches: Array<{ id: string; seriesName: string; seriesPosition: number }>;
};

export function assignBooksToSeries({
  books,
  ids,
  seriesName,
  seriesPosition,
}: AssignBooksToSeriesInput): AssignBooksToSeriesResult {
  const name = seriesName.trim();
  if (name === "" || !Number.isFinite(seriesPosition)) {
    return { patches: [] };
  }
  const idSet = new Set(ids);
  const patches: AssignBooksToSeriesResult["patches"] = [];
  for (const item of books) {
    if (item.type !== "book" || !idSet.has(item.id)) continue;
    patches.push({ id: item.id, seriesName: name, seriesPosition });
  }
  return { patches };
}
