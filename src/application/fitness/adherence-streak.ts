import { countCompletedWorkoutsInWeek, startOfWeekMonday } from "@/domain/fitness/adherence";
import type { FitnessUserSettings, FitnessWorkoutLog } from "@/domain/fitness/workout-log";
import { localCalendarDate } from "./today";

export function computeAdherenceStreak(
  logs: FitnessWorkoutLog[],
  settings: FitnessUserSettings,
  referenceDate: string = localCalendarDate(),
): number {
  if (!settings.adherenceTrackingEnabled) return 0;
  const min = settings.adherenceMinWorkoutsPerWeek;
  let streak = 0;
  let weekStart = startOfWeekMonday(referenceDate);
  for (let i = 0; i < 104; i++) {
    const count = countCompletedWorkoutsInWeek(logs, weekStart);
    if (count >= min) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
    const [y, m, d] = weekStart.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 7);
    const yy = prev.getFullYear();
    const mm = String(prev.getMonth() + 1).padStart(2, "0");
    const dd = String(prev.getDate()).padStart(2, "0");
    weekStart = `${yy}-${mm}-${dd}`;
  }
  return streak;
}
