import type { FitnessWorkoutLog, LoggedExercise, SetRow } from "./workout-log";

export type PersonalRecord = {
  exerciseId: string;
  maxChargeKg: number | null;
  maxRepsAtMaxCharge: number | null;
};

export function derivePersonalRecords(logs: FitnessWorkoutLog[]): Map<string, PersonalRecord> {
  const map = new Map<string, PersonalRecord>();
  for (const log of logs) {
    if (log.status !== "completed" || log.deletedAt !== null) continue;
    for (const exercise of log.loggedExercises) {
      const current = map.get(exercise.exerciseId) ?? {
        exerciseId: exercise.exerciseId,
        maxChargeKg: null,
        maxRepsAtMaxCharge: null,
      };
      for (const set of exercise.sets) {
        const charge = set.chargeKg ?? null;
        const reps = set.reps ?? null;
        if (charge !== null && (current.maxChargeKg === null || charge > current.maxChargeKg)) {
          current.maxChargeKg = charge;
          current.maxRepsAtMaxCharge = reps;
        } else if (
          charge !== null &&
          current.maxChargeKg !== null &&
          charge === current.maxChargeKg &&
          reps !== null &&
          (current.maxRepsAtMaxCharge === null || reps > current.maxRepsAtMaxCharge)
        ) {
          current.maxRepsAtMaxCharge = reps;
        }
      }
      map.set(exercise.exerciseId, current);
    }
  }
  return map;
}

export type ProgressionPoint = {
  calendarDate: string;
  workoutId: string;
  bestChargeKg: number | null;
  bestReps: number | null;
};

export function progressionSeriesForExercise(
  logs: FitnessWorkoutLog[],
  exerciseId: string,
): ProgressionPoint[] {
  const points: ProgressionPoint[] = [];
  const sorted = [...logs]
    .filter((l) => l.status === "completed" && l.deletedAt === null)
    .sort((a, b) => a.calendarDate.localeCompare(b.calendarDate));
  for (const log of sorted) {
    const exercise = log.loggedExercises.find((e) => e.exerciseId === exerciseId);
    if (exercise === undefined) continue;
    let bestCharge: number | null = null;
    let bestReps: number | null = null;
    for (const set of exercise.sets) {
      const c = set.chargeKg ?? null;
      const r = set.reps ?? null;
      if (c !== null && (bestCharge === null || c > bestCharge)) {
        bestCharge = c;
        bestReps = r;
      }
    }
    points.push({
      calendarDate: log.calendarDate,
      workoutId: log.id,
      bestChargeKg: bestCharge,
      bestReps,
    });
  }
  return points;
}

export function isPersonalRecordOnSave(
  priorLogs: FitnessWorkoutLog[],
  exerciseId: string,
  newSets: SetRow[],
): boolean {
  const prior = derivePersonalRecords(priorLogs);
  const record = prior.get(exerciseId);
  const priorMax = record?.maxChargeKg ?? null;
  for (const set of newSets) {
    const charge = set.chargeKg ?? null;
    if (charge !== null && (priorMax === null || charge > priorMax)) return true;
  }
  return false;
}

export function bestSetFromExercise(exercise: LoggedExercise): { chargeKg: number | null; reps: number | null } {
  let bestCharge: number | null = null;
  let bestReps: number | null = null;
  for (const set of exercise.sets) {
    const c = set.chargeKg ?? null;
    if (c !== null && (bestCharge === null || c > bestCharge)) {
      bestCharge = c;
      bestReps = set.reps ?? null;
    }
  }
  return { chargeKg: bestCharge, reps: bestReps };
}
