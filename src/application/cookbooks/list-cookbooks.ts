import type { CookbookRepository } from "@/application/ports/cookbook-repository";
import type { Cookbook } from "@/domain/cookbook";

export type ListCookbooksDeps = {
  repository: CookbookRepository;
};

export function createListCookbooks(deps: ListCookbooksDeps) {
  return {
    listCookbooks(): Promise<Cookbook[]> {
      return deps.repository.listAll();
    },
  };
}
