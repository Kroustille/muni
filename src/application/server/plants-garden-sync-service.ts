import { mergePlant, plantToWire, plantWireSchema, wireToPlant, type PlantWire } from "@/domain/plant";
import {
  mergePlantCareEvent,
  plantCareEventToWire,
  plantCareEventWireSchema,
  wireToPlantCareEvent,
  type PlantCareEventWire,
} from "@/domain/plant-care-event";
import {
  mergePlantCareProfile,
  plantCareProfileToWire,
  plantCareProfileWireSchema,
  wireToPlantCareProfile,
  type PlantCareProfileWire,
} from "@/domain/plant-care-profile";
import {
  mergeVegetableCulture,
  vegetableCultureToWire,
  vegetableCultureWireSchema,
  wireToVegetableCulture,
  type VegetableCultureWire,
} from "@/domain/vegetable-culture";
import {
  mergeVegetableMilestone,
  vegetableMilestoneToWire,
  vegetableMilestoneWireSchema,
  wireToVegetableMilestone,
  type VegetableMilestoneWire,
} from "@/domain/vegetable-milestone";
import type { ServerPlantsGardenPlantRepository } from "@/application/ports/plants-garden-plant-repository";
import type { ServerPlantsGardenCareEventRepository } from "@/application/ports/plants-garden-care-event-repository";
import type { ServerPlantsGardenCareProfileRepository } from "@/application/ports/plants-garden-care-profile-repository";
import type { ServerPlantsGardenCultureRepository } from "@/application/ports/plants-garden-culture-repository";
import type { ServerPlantsGardenMilestoneRepository } from "@/application/ports/plants-garden-milestone-repository";
import { SyncAuthError, SyncValidationError, type RowError } from "./sync-service";

export type PlantsGardenSyncService = {
  push(
    userId: string,
    body: {
      plants: PlantWire[];
      careEvents: PlantCareEventWire[];
      careProfiles: PlantCareProfileWire[];
      cultures: VegetableCultureWire[];
      milestones: VegetableMilestoneWire[];
    },
  ): Promise<{
    plants: PlantWire[];
    careEvents: PlantCareEventWire[];
    careProfiles: PlantCareProfileWire[];
    cultures: VegetableCultureWire[];
    milestones: VegetableMilestoneWire[];
  }>;
  pull(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<{
    plants: PlantWire[];
    careEvents: PlantCareEventWire[];
    careProfiles: PlantCareProfileWire[];
    cultures: VegetableCultureWire[];
    milestones: VegetableMilestoneWire[];
    cursor: string;
  }>;
};

type PlantsGardenSyncServiceDeps = {
  plants: ServerPlantsGardenPlantRepository;
  careEvents: ServerPlantsGardenCareEventRepository;
  careProfiles: ServerPlantsGardenCareProfileRepository;
  cultures: ServerPlantsGardenCultureRepository;
  milestones: ServerPlantsGardenMilestoneRepository;
  now?: () => Date;
};

function assertUserId(userId: string): void {
  if (!userId) throw new SyncAuthError();
}

function formatZodIssues(error: { issues: { message: string }[] }): string {
  const messages = error.issues.map((issue) => issue.message).filter(Boolean);
  return messages.length > 0 ? messages.join("; ") : "validation failed";
}

function validateWireArray<T>(
  items: unknown[],
  label: string,
  schema: {
    safeParse: (
      v: unknown,
    ) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } };
  },
): T[] {
  const rowErrors: RowError[] = [];
  const validated: T[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item === null || typeof item !== "object") {
      rowErrors.push({ index, message: `invalid ${label}` });
      continue;
    }
    const record = item as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : undefined;
    if (Object.prototype.hasOwnProperty.call(record, "user_id")) {
      rowErrors.push({ index, id, message: "user_id must not be present" });
      continue;
    }
    const parsed = schema.safeParse(item);
    if (!parsed.success) {
      rowErrors.push({ index, id, message: formatZodIssues(parsed.error) });
      continue;
    }
    validated.push(parsed.data);
  }
  if (rowErrors.length > 0) throw new SyncValidationError(rowErrors);
  return validated;
}

export function validatePushPlantsGarden(body: {
  plants?: unknown[];
  careEvents?: unknown[];
  careProfiles?: unknown[];
  cultures?: unknown[];
  milestones?: unknown[];
}): {
  plants: PlantWire[];
  careEvents: PlantCareEventWire[];
  careProfiles: PlantCareProfileWire[];
  cultures: VegetableCultureWire[];
  milestones: VegetableMilestoneWire[];
} {
  return {
    plants: validateWireArray(body.plants ?? [], "plant", plantWireSchema),
    careEvents: validateWireArray(body.careEvents ?? [], "care event", plantCareEventWireSchema),
    careProfiles: validateWireArray(body.careProfiles ?? [], "care profile", plantCareProfileWireSchema),
    cultures: validateWireArray(body.cultures ?? [], "culture", vegetableCultureWireSchema),
    milestones: validateWireArray(body.milestones ?? [], "milestone", vegetableMilestoneWireSchema),
  };
}

function serverUpdatedAtIso(now: () => Date): string {
  return now().toISOString();
}

async function pushPlants(
  userId: string,
  repo: ServerPlantsGardenPlantRepository,
  incoming: PlantWire[],
  now: () => Date,
): Promise<PlantWire[]> {
  return repo.transaction(async (plants) => {
    const results: PlantWire[] = [];
    for (const row of incoming) {
      const locked = await plants.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: PlantWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = plantToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergePlant(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await plants.upsert(userId, wireToPlant(merged));
      results.push(plantToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushCareEvents(
  userId: string,
  repo: ServerPlantsGardenCareEventRepository,
  incoming: PlantCareEventWire[],
  now: () => Date,
): Promise<PlantCareEventWire[]> {
  return repo.transaction(async (events) => {
    const results: PlantCareEventWire[] = [];
    for (let index = 0; index < incoming.length; index++) {
      const row = incoming[index]!;
      if (row.event_type === "water" && row.deleted_at === null) {
        const duplicate = await events.findWaterOnDay(userId, row.plant_id, row.occurred_at, row.id);
        if (duplicate !== undefined) {
          throw new SyncValidationError([
            { index, id: row.id, message: "duplicate water event for plant on calendar day" },
          ]);
        }
      }
      const locked = await events.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: PlantCareEventWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = plantCareEventToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergePlantCareEvent(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await events.upsert(userId, wireToPlantCareEvent(merged));
      results.push(plantCareEventToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushCareProfiles(
  userId: string,
  repo: ServerPlantsGardenCareProfileRepository,
  incoming: PlantCareProfileWire[],
  now: () => Date,
): Promise<PlantCareProfileWire[]> {
  return repo.transaction(async (profiles) => {
    const results: PlantCareProfileWire[] = [];
    for (const row of incoming) {
      const locked = await profiles.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: PlantCareProfileWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = plantCareProfileToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergePlantCareProfile(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await profiles.upsert(userId, wireToPlantCareProfile(merged));
      results.push(plantCareProfileToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushCultures(
  userId: string,
  repo: ServerPlantsGardenCultureRepository,
  incoming: VegetableCultureWire[],
  now: () => Date,
): Promise<VegetableCultureWire[]> {
  return repo.transaction(async (cultures) => {
    const results: VegetableCultureWire[] = [];
    for (const row of incoming) {
      const locked = await cultures.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: VegetableCultureWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = vegetableCultureToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergeVegetableCulture(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await cultures.upsert(userId, wireToVegetableCulture(merged));
      results.push(vegetableCultureToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

async function pushMilestones(
  userId: string,
  repo: ServerPlantsGardenMilestoneRepository,
  incoming: VegetableMilestoneWire[],
  now: () => Date,
): Promise<VegetableMilestoneWire[]> {
  return repo.transaction(async (milestones) => {
    const results: VegetableMilestoneWire[] = [];
    for (let index = 0; index < incoming.length; index++) {
      const row = incoming[index]!;
      if (row.deleted_at === null) {
        const duplicate = await milestones.findOnDay(
          userId,
          row.culture_id,
          row.milestone_type,
          row.occurred_at,
          row.id,
        );
        if (duplicate !== undefined) {
          throw new SyncValidationError([
            {
              index,
              id: row.id,
              message: "duplicate milestone for culture type on calendar day",
            },
          ]);
        }
      }
      const locked = await milestones.findByIds(userId, [row.id]);
      const existing = locked[0];
      let merged: VegetableMilestoneWire;
      if (!existing) {
        merged = { ...row, server_updated_at: serverUpdatedAtIso(now) };
      } else {
        const existingWire = vegetableMilestoneToWire(existing);
        merged =
          JSON.stringify(row) === JSON.stringify(existingWire)
            ? { ...existingWire, server_updated_at: existingWire.server_updated_at ?? null }
            : {
                ...mergeVegetableMilestone(row, existingWire),
                server_updated_at: serverUpdatedAtIso(now),
              };
      }
      const saved = await milestones.upsert(userId, wireToVegetableMilestone(merged));
      results.push(vegetableMilestoneToWire(saved, merged.server_updated_at ?? null));
    }
    return results;
  });
}

export function createPlantsGardenSyncService(deps: PlantsGardenSyncServiceDeps): PlantsGardenSyncService {
  const now = deps.now ?? (() => new Date());

  return {
    async push(userId, body) {
      assertUserId(userId);
      const validated = validatePushPlantsGarden(body);
      const [plants, careEvents, careProfiles, cultures, milestones] = await Promise.all([
        pushPlants(userId, deps.plants, validated.plants, now),
        pushCareEvents(userId, deps.careEvents, validated.careEvents, now),
        pushCareProfiles(userId, deps.careProfiles, validated.careProfiles, now),
        pushCultures(userId, deps.cultures, validated.cultures, now),
        pushMilestones(userId, deps.milestones, validated.milestones, now),
      ]);
      return { plants, careEvents, careProfiles, cultures, milestones };
    },

    async pull(userId, since, limit) {
      assertUserId(userId);
      const sinceDate = since === null ? null : new Date(since);
      const [plants, careEvents, careProfiles, cultures, milestones] = await Promise.all([
        deps.plants.pullSince(userId, sinceDate, limit),
        deps.careEvents.pullSince(userId, sinceDate, limit),
        deps.careProfiles.pullSince(userId, sinceDate, limit),
        deps.cultures.pullSince(userId, sinceDate, limit),
        deps.milestones.pullSince(userId, sinceDate, limit),
      ]);
      const plantWires = plants.map((p) => plantToWire(p));
      const careEventWires = careEvents.map((e) => plantCareEventToWire(e));
      const careProfileWires = careProfiles.map((p) => plantCareProfileToWire(p));
      const cultureWires = cultures.map((c) => vegetableCultureToWire(c));
      const milestoneWires = milestones.map((m) => vegetableMilestoneToWire(m));
      const cursors = [
        ...plantWires.map((w) => w.server_updated_at),
        ...careEventWires.map((w) => w.server_updated_at),
        ...careProfileWires.map((w) => w.server_updated_at),
        ...cultureWires.map((w) => w.server_updated_at),
        ...milestoneWires.map((w) => w.server_updated_at),
      ].filter((c): c is string => typeof c === "string");
      const cursor = cursors.sort().at(-1) ?? since ?? "";
      return {
        plants: plantWires,
        careEvents: careEventWires,
        careProfiles: careProfileWires,
        cultures: cultureWires,
        milestones: milestoneWires,
        cursor,
      };
    },
  };
}
