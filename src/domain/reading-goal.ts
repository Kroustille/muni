import { z } from "zod";

export const readingGoalSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  targetCount: z.number().int().min(1),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
});

export type ReadingGoal = z.infer<typeof readingGoalSchema>;
