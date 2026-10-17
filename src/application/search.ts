import type { Item } from "../domain/item";
import { normalizeText } from "../domain/text";
import type { ItemRepository } from "./ports/item-repository";

export type SearchUseCaseDeps = {
  repository: ItemRepository;
};

export type SearchUseCase = {
  search(query: string): Promise<Item[]>;
};

type IndexedItem = {
  item: Item;
  normalizedFields: string[];
};

function indexedFieldsForItem(item: Item): string[] {
  const fields = [normalizeText(item.title)];
  if (item.type === "book" && item.author) {
    fields.push(normalizeText(item.author));
  }
  if (item.type === "movie" && item.director) {
    fields.push(normalizeText(item.director));
  }
  return fields;
}

export function createSearchUseCase({ repository }: SearchUseCaseDeps): SearchUseCase {
  let entries: IndexedItem[] = [];
  let loadPromise: Promise<void> = Promise.resolve();

  const rebuild = async (): Promise<void> => {
    const items = await repository.query();
    entries = items.map((item) => ({
      item,
      normalizedFields: indexedFieldsForItem(item),
    }));
  };

  loadPromise = rebuild();
  repository.subscribe(() => {
    loadPromise = loadPromise.then(rebuild);
  });

  return {
    async search(query: string): Promise<Item[]> {
      await loadPromise;
      const normalizedQuery = normalizeText(query);
      if (normalizedQuery.length === 0) return [];
      return entries
        .filter((entry) =>
          entry.normalizedFields.some((field) => field.includes(normalizedQuery)),
        )
        .map((entry) => entry.item);
    },
  };
}
