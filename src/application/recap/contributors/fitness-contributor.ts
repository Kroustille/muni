import { toLocalDateKey } from "@/application/shared/activity-days";
import type { RecapAchievement } from "@/domain/recap";
import { recapDateInRange } from "@/application/recap/period";
import type { DomainRecapContributor } from "@/application/recap/contributor-types";

export const fitnessRecapContributor: DomainRecapContributor = {
  domainId: "fitness",
  async collectAchievements(deps, range) {
    const workouts = await deps.fitnessWorkouts.list();
    const achievements: RecapAchievement[] = [];
    for (const workout of workouts) {
      if (workout.deletedAt != null || workout.status !== "completed") continue;
      const instant = workout.completedAt ?? `${workout.calendarDate}T12:00:00.000Z`;
      const occurredOn = workout.completedAt
        ? toLocalDateKey(workout.completedAt, range.timeZone)
        : workout.calendarDate;
      if (!recapDateInRange(occurredOn, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "fitness",
        occurredOn,
        sortInstant: instant,
        title: workout.title,
        sourceWorkoutId: workout.id,
        deepLinkHref: `/fitness/workout/${workout.id}`,
      });
    }
    return achievements;
  },
};
