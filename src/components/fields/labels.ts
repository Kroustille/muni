import fr from "@/i18n/fr.json";

/** Mirrors pending `field.recommendedBy` in fr.json (added in T064). */
export function recommendedByLabel(): string {
  const key = "field.recommendedBy";
  return key in fr ? (fr as Record<string, string>)[key] : "Recommandé par";
}
