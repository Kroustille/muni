export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function matchesTitle(title: string, query: string): boolean {
  return normalizeText(title).includes(normalizeText(query));
}
