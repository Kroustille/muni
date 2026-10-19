const RECENT_KEY = "muni.fitness.recentExercises";
const MAX_RECENT = 12;

export function loadRecentExerciseIds(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function rememberExerciseId(exerciseId: string): void {
  if (typeof localStorage === "undefined") return;
  const current = loadRecentExerciseIds().filter((id) => id !== exerciseId);
  current.unshift(exerciseId);
  localStorage.setItem(RECENT_KEY, JSON.stringify(current.slice(0, MAX_RECENT)));
}
