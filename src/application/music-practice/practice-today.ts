import type { PlanAssignment, PracticePlan } from "@/domain/practice-plan";
import type { PracticeExercise } from "@/domain/practice-exercise";
import { isoWeekdayFromCalendarDate } from "@/domain/fitness/adherence";
import { localCalendarDate } from "@/domain/music-practice-dates";

export type TodayExercise = {
  exerciseId: string;
  sortOrder: number;
  assignmentId: string;
};

export function assignmentsForDate(plan: PracticePlan, calendarDate: string): PlanAssignment[] {
  const weekday = isoWeekdayFromCalendarDate(calendarDate);
  return plan.assignments.filter((a) => {
    const dates = a.specificDates ?? [];
    if (dates.includes(calendarDate)) return true;
    const weekdays = a.weekdays ?? [];
    return weekdays.includes(weekday);
  });
}

export function resolveTodayExercises(
  plan: PracticePlan | undefined,
  calendarDate: string = localCalendarDate(),
): TodayExercise[] {
  if (plan === undefined || plan.deletedAt !== null || !plan.isActive) return [];
  const matches = assignmentsForDate(plan, calendarDate);
  const byExercise = new Map<string, TodayExercise>();
  for (const assignment of matches) {
    const existing = byExercise.get(assignment.exerciseId);
    if (existing === undefined || assignment.sortOrder < existing.sortOrder) {
      byExercise.set(assignment.exerciseId, {
        exerciseId: assignment.exerciseId,
        sortOrder: assignment.sortOrder,
        assignmentId: assignment.id,
      });
    }
  }
  return [...byExercise.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function hydrateTodayExercises(
  today: TodayExercise[],
  exercises: PracticeExercise[],
): { exercise: PracticeExercise; assignmentId: string }[] {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  return today
    .map((t) => {
      const exercise = byId.get(t.exerciseId);
      if (exercise === undefined || exercise.deletedAt !== null) return undefined;
      return { exercise, assignmentId: t.assignmentId };
    })
    .filter((row): row is NonNullable<typeof row> => row !== undefined);
}
