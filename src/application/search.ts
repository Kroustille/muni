import type { Item } from "../domain/item";
import { normalizeText } from "../domain/text";
import type { ItemRepository } from "./ports/item-repository";
import type { CookbookUseCases } from "./cookbooks/cookbook-use-cases";

export type SearchUseCaseDeps = {
  repository: ItemRepository;
  cookbooks?: Pick<CookbookUseCases, "getCookbook" | "subscribe">;
};

export type SearchUseCase = {
  search(query: string): Promise<Item[]>;
};

type IndexedItem = {
  item: Item;
  normalizedFields: string[];
};

async function indexedFieldsForItem(
  item: Item,
  getCookbook: CookbookUseCases["getCookbook"] | undefined,
): Promise<string[]> {
  const fields = [normalizeText(item.title)];
  if (item.type === "book" && item.author) {
    fields.push(normalizeText(item.author));
  }
  if (item.type === "movie" && item.director) {
    fields.push(normalizeText(item.director));
  }
  if (item.type === "recipe" && item.cookbookId && getCookbook) {
    const cookbook = await getCookbook(item.cookbookId);
    if (cookbook) {
      fields.push(normalizeText(cookbook.title));
      if (cookbook.author) fields.push(normalizeText(cookbook.author));
    }
  }
  return fields;
}

export function createSearchUseCase({ repository, cookbooks }: SearchUseCaseDeps): SearchUseCase {
  let entries: IndexedItem[] = [];
  let loadPromise: Promise<void> = Promise.resolve();

  const rebuild = async (): Promise<void> => {
    const items = await repository.query();
    entries = await Promise.all(
      items.map(async (item) => ({
        item,
        normalizedFields: await indexedFieldsForItem(item, cookbooks?.getCookbook),
      })),
    );
  };

  const scheduleRebuild = (): void => {
    loadPromise = loadPromise.then(rebuild);
  };

  loadPromise = rebuild();
  repository.subscribe(scheduleRebuild);
  cookbooks?.subscribe(scheduleRebuild);

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
