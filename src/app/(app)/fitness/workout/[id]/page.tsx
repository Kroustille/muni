"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { WorkoutLogEditor } from "@/components/fitness/workout-log-editor";
import { getFitnessWorkoutUseCases } from "@/composition/client";
import { derivePersonalRecords, isPersonalRecordOnSave } from "@/domain/fitness/progression";
import type { FitnessWorkoutLog } from "@/domain/fitness/workout-log";

export default function FitnessWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<FitnessWorkoutLog | undefined>();
  const [allLogs, setAllLogs] = useState<FitnessWorkoutLog[]>([]);

  useEffect(() => {
    void getFitnessWorkoutUseCases().then(async (uc) => {
      const log = await uc.getWorkout(params.id);
      const logs = await uc.listWorkouts();
      setWorkout(log);
      setAllLogs(logs);
    });
  }, [params.id]);

  const prIds = useMemo(() => {
    if (workout === undefined) return new Set<string>();
    const prior = allLogs.filter((l) => l.id !== workout.id);
    const ids = new Set<string>();
    for (const ex of workout.loggedExercises) {
      if (isPersonalRecordOnSave(prior, ex.exerciseId, ex.sets)) ids.add(ex.exerciseId);
    }
    const records = derivePersonalRecords(allLogs);
    for (const ex of workout.loggedExercises) {
      if (records.has(ex.exerciseId)) ids.add(ex.exerciseId);
    }
    return ids;
  }, [workout, allLogs]);

  if (workout === undefined) return null;

  return (
    <div className="mx-auto max-w-lg p-4">
      <WorkoutLogEditor
        workout={workout}
        prExerciseIds={prIds}
        onUpdate={(loggedExercises) => {
          setWorkout((prev) => (prev === undefined ? prev : { ...prev, loggedExercises }));
          void getFitnessWorkoutUseCases().then(async (uc) => {
            const updated = await uc.updateLoggedExercises(workout.id, loggedExercises);
            setWorkout(updated);
          });
        }}
        onComplete={async () => {
          const uc = await getFitnessWorkoutUseCases();
          const updated = await uc.completeWorkout(workout.id);
          setWorkout(updated);
        }}
        onAbandon={async () => {
          const uc = await getFitnessWorkoutUseCases();
          await uc.abandonWorkout(workout.id);
          window.location.assign("/fitness");
        }}
        onRecovery={async (recovery) => {
          const uc = await getFitnessWorkoutUseCases();
          const updated = await uc.updateRecovery(workout.id, recovery);
          setWorkout(updated);
        }}
      />
    </div>
  );
}
