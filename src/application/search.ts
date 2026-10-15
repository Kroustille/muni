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
  normalizedTitle: string;
};

export function createSearchUseCase({ repository }: SearchUseCaseDeps): SearchUseCase {
  let entries: IndexedItem[] = [];
  let loadPromise: Promise<void> = Promise.resolve();

  const rebuild = async (): Promise<void> => {
    const items = await repository.query();
    entries = items.map((item) => ({
      item,
      normalizedTitle: normalizeText(item.title),
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
        .filter((entry) => entry.normalizedTitle.includes(normalizedQuery))
        .map((entry) => entry.item);
    },
  };
}
