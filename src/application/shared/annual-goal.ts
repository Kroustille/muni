export type AnnualGoalShape = {
  year: number;
  targetCount: number;
  fieldsUpdatedAt: Record<string, string>;
};

export interface AnnualGoalRepository<TGoal extends AnnualGoalShape> {
  get(year: number): Promise<TGoal | undefined>;
  list(): Promise<TGoal[]>;
  put(goal: TGoal): Promise<void>;
}

export type AnnualGoalSettingsUseCases<TGoal extends AnnualGoalShape> = {
  getAnnualGoal(year: number): Promise<TGoal | undefined>;
  setAnnualGoal(year: number, targetCount: number): Promise<TGoal>;
};

export function createAnnualGoalSettings<TGoal extends AnnualGoalShape>({
  repository,
  now,
}: {
  repository: AnnualGoalRepository<TGoal>;
  now: () => number;
}): AnnualGoalSettingsUseCases<TGoal> {
  return {
    getAnnualGoal: (year) => repository.get(year),
    setAnnualGoal: async (year, targetCount) => {
      const stamp = new Date(now()).toISOString();
      const goal = {
        year,
        targetCount,
        fieldsUpdatedAt: { targetCount: stamp },
      } as unknown as TGoal;
      await repository.put(goal);
      return goal;
    },
  };
}
