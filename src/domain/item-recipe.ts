import { z } from "zod";

export const COOKED_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const cookedDatesSchema = z
  .array(z.string().regex(COOKED_DATE_PATTERN))
  .max(3660);

export function isValidCookedDate(value: string): boolean {
  if (!COOKED_DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateCookedDatesForRecipe(
  type: string,
  cookedDates: string[] | null | undefined,
): string[] | null {
  if (cookedDates == null) return null;
  if (type !== "recipe") {
    throw new Error("cookedDates is only allowed on recipe items");
  }
  const parsed = cookedDatesSchema.parse(cookedDates);
  for (const entry of parsed) {
    if (!isValidCookedDate(entry)) {
      throw new Error(`invalid cooked date: ${entry}`);
    }
  }
  return parsed.length === 0 ? null : parsed;
}
