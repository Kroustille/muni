/** Per-tier colors for 1–5 personal ratings (list rows and editors). */
const TIER_CLASS: Record<number, string> = {
  1: "border-red-700 bg-red-600 text-white dark:border-red-500 dark:bg-red-500",
  2: "border-orange-700 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-500",
  3: "border-amber-600 bg-amber-500 text-amber-950 dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950",
  4: "border-lime-700 bg-lime-600 text-white dark:border-lime-500 dark:bg-lime-500",
  5: "border-emerald-700 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500",
};

export function ratingTierClass(stars: number): string {
  return TIER_CLASS[stars] ?? TIER_CLASS[3];
}

export function ratingBadgeClass(rating: number): string {
  return `inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums ${ratingTierClass(rating)}`;
}
