import { normalizeText } from "@/domain/text";
import type { Cookbook } from "@/domain/cookbook";

const DEFAULT_LIMIT = 20;

export function listCookbooks(all: Cookbook[]): Cookbook[] {
  return [...all]
    .filter((row) => row.deletedAt === null)
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export function searchCookbooks(all: Cookbook[], query: string, limit = DEFAULT_LIMIT): Cookbook[] {
  const normalizedQuery = normalizeText(query.trim());
  if (normalizedQuery === "") {
    return listCookbooks(all).slice(0, limit);
  }
  return listCookbooks(all)
    .filter((cookbook) => {
      const haystacks = [cookbook.title];
      if (cookbook.author) haystacks.push(cookbook.author);
      return haystacks.some((value) => normalizeText(value).includes(normalizedQuery));
    })
    .slice(0, limit);
}

export function exactTitleMatch(all: Cookbook[], title: string): Cookbook | undefined {
  const normalized = normalizeText(title.trim());
  if (normalized === "") return undefined;
  return listCookbooks(all).find((cookbook) => normalizeText(cookbook.title) === normalized);
}
