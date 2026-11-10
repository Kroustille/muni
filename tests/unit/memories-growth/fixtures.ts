import type { Achievement } from "@/domain/achievement";
import type { Goal, GoalCheckin } from "@/domain/goal";
import type { Souvenir } from "@/domain/souvenir";

const CREATED = "2026-11-01T10:00:00.000Z";

export function buildSouvenir(overrides: Partial<Souvenir> = {}): Souvenir {
  return {
    id: "a1111111-2222-4333-8444-555555555555",
    title: "Concert au Zénith",
    occurredOn: "2026-11-08",
    body: null,
    mood: null,
    place: null,
    favourite: false,
    links: [],
    createdAt: CREATED,
    deletedAt: null,
    fieldsUpdatedAt: {},
    ...overrides,
  };
}

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "b1111111-2222-4333-8444-555555555555",
    title: "Lire 3 livres ce mois-ci",
    periodKind: "month",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    targetKind: "domain_count",
    metric: "books",
    targetCount: 3,
    status: "active",
    reflection: null,
    reflectionPromptDismissedAt: null,
    createdAt: CREATED,
    deletedAt: null,
    fieldsUpdatedAt: {},
    ...overrides,
  };
}

export function buildGoalCheckin(overrides: Partial<GoalCheckin> = {}): GoalCheckin {
  return {
    id: "c1111111-2222-4333-8444-555555555555",
    goalId: "b1111111-2222-4333-8444-555555555555",
    occurredOn: "2026-11-05",
    note: null,
    createdAt: CREATED,
    deletedAt: null,
    fieldsUpdatedAt: {},
    ...overrides,
  };
}

export function buildAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: "d1111111-2222-4333-8444-555555555555",
    origin: "auto",
    ruleId: "books_read",
    ruleVersion: 1,
    threshold: 10,
    title: "10 livres lus",
    earnedOn: "2026-11-02",
    body: null,
    links: [],
    celebratedAt: null,
    createdAt: CREATED,
    deletedAt: null,
    fieldsUpdatedAt: {},
    ...overrides,
  };
}
