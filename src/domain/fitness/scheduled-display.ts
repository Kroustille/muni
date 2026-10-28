import type { FitnessScheduledSession } from "./scheduled-session";
import type { FitnessSessionTemplate } from "./session-template";
import type { FitnessSkipRecord, FitnessWorkoutLog } from "./workout-log";

export function workoutForScheduledOnDate(
  logs: FitnessWorkoutLog[],
  scheduledSessionId: string,
  calendarDate: string,
): FitnessWorkoutLog | undefined {
  return logs.find(
    (l) =>
      l.deletedAt === null &&
      l.scheduledSessionId === scheduledSessionId &&
      l.calendarDate === calendarDate,
  );
}

export function skipForScheduledOnDate(
  skips: FitnessSkipRecord[],
  scheduledSessionId: string,
  calendarDate: string,
): FitnessSkipRecord | undefined {
  return skips.find(
    (s) =>
      s.deletedAt === null &&
      s.scheduledSessionId === scheduledSessionId &&
      s.calendarDate === calendarDate,
  );
}

/** French title for a scheduled day row; survives template soft-delete when workout/skip/snapshot exist. */
export function resolveScheduledSessionTitle(
  scheduled: FitnessScheduledSession,
  template: FitnessSessionTemplate | undefined,
  logs: FitnessWorkoutLog[],
  skips: FitnessSkipRecord[],
): string | null {
  if (template !== undefined) return template.title;

  const log = workoutForScheduledOnDate(logs, scheduled.id, scheduled.calendarDate);
  if (log !== undefined) return log.title;

  const skip = skipForScheduledOnDate(skips, scheduled.id, scheduled.calendarDate);
  if (skip?.titleSnapshot !== null && skip?.titleSnapshot !== undefined) {
    return skip.titleSnapshot;
  }

  if (scheduled.titleSnapshot !== null && scheduled.titleSnapshot !== undefined) {
    return scheduled.titleSnapshot;
  }

  return null;
}

export function scheduledRowHasActivity(
  scheduled: FitnessScheduledSession,
  logs: FitnessWorkoutLog[],
  skips: FitnessSkipRecord[],
): boolean {
  const log = workoutForScheduledOnDate(logs, scheduled.id, scheduled.calendarDate);
  if (log !== undefined) return true;
  return skipForScheduledOnDate(skips, scheduled.id, scheduled.calendarDate) !== undefined;
}
