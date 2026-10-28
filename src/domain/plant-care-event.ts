import { z } from "zod";

import { mergeLwwWire } from "@/domain/fitness/merge-lww";

const timestamp = z.iso.datetime({ offset: true });

export const plantCareEventTypes = [
  "water",
  "fertilize",
  "repot",
  "prune",
  "mist",
  "other",
] as const;
export type PlantCareEventType = (typeof plantCareEventTypes)[number];

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type PlantCareEvent = {
  id: string;
  plantId: string;
  eventType: PlantCareEventType;
  occurredAt: string;
  notes: string | null;
  seasonalHintId: string | null;
  deletedAt: string | null;
  fieldsUpdatedAt: Record<string, string>;
};

const eventShape = {
  id: z.uuid(),
  plantId: z.uuid(),
  eventType: z.enum(plantCareEventTypes),
  occurredAt: calendarDate,
  notes: z.string().max(2000).nullable(),
  seasonalHintId: z.uuid().nullable(),
  deletedAt: timestamp.nullable(),
  fieldsUpdatedAt: z.record(z.string(), z.string()),
};

export const plantCareEventSchema = z.strictObject(eventShape);

const SNAKE: Partial<Record<keyof PlantCareEvent, string>> = {
  plantId: "plant_id",
  eventType: "event_type",
  occurredAt: "occurred_at",
  seasonalHintId: "seasonal_hint_id",
  deletedAt: "deleted_at",
  fieldsUpdatedAt: "fields_updated_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof PlantCareEvent] ?? field;
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([camel, snake]) => [snake, camel]));
const camelOf = (field: string): string => CAMEL[field] ?? field;

function mapKeys<T>(source: Record<string, T>, rename: (key: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [rename(key), value]));
}

export const plantCareEventWireSchema = z.strictObject({
  id: eventShape.id,
  plant_id: eventShape.plantId,
  event_type: eventShape.eventType,
  occurred_at: eventShape.occurredAt,
  notes: eventShape.notes,
  seasonal_hint_id: eventShape.seasonalHintId,
  deleted_at: eventShape.deletedAt,
  fields_updated_at: eventShape.fieldsUpdatedAt,
  server_updated_at: timestamp.nullable().optional(),
});

export type PlantCareEventWire = z.infer<typeof plantCareEventWireSchema>;

export function plantCareEventToWire(
  event: PlantCareEvent,
  serverUpdatedAt: string | null = null,
): PlantCareEventWire {
  const { fieldsUpdatedAt, ...rest } = event;
  return {
    ...(mapKeys(rest, snakeOf) as Omit<PlantCareEventWire, "fields_updated_at" | "server_updated_at">),
    fields_updated_at: mapKeys(fieldsUpdatedAt, snakeOf),
    server_updated_at: serverUpdatedAt,
  };
}

export function wireToPlantCareEvent(wire: PlantCareEventWire): PlantCareEvent {
  const { fields_updated_at, server_updated_at, ...rest } = wire;
  void server_updated_at;
  return plantCareEventSchema.parse({
    ...mapKeys(rest, camelOf),
    fieldsUpdatedAt: mapKeys(fields_updated_at, camelOf),
  }) as PlantCareEvent;
}

const MERGED_EVENT_FIELDS = [
  "plant_id",
  "event_type",
  "occurred_at",
  "notes",
  "seasonal_hint_id",
  "deleted_at",
] as const satisfies readonly (keyof PlantCareEventWire)[];

export function mergePlantCareEvent(local: PlantCareEventWire, remote: PlantCareEventWire): PlantCareEventWire {
  return mergeLwwWire(local, remote, MERGED_EVENT_FIELDS);
}

export function validateOccurredAtNotFuture(occurredAt: string, todayCalendar: string): string | null {
  if (!calendarDate.safeParse(occurredAt).success) return "invalid date";
  if (occurredAt > todayCalendar) return "occurredAt must not be future";
  return null;
}

export function waterEventOnDay(
  events: readonly PlantCareEvent[],
  plantId: string,
  day: string,
): PlantCareEvent | undefined {
  return events.find(
    (e) =>
      e.plantId === plantId &&
      e.eventType === "water" &&
      e.occurredAt === day &&
      e.deletedAt === null,
  );
}

export function lastWateredDate(events: readonly PlantCareEvent[]): string | null {
  const dates = events
    .filter((e) => e.eventType === "water" && e.deletedAt === null)
    .map((e) => e.occurredAt);
  if (dates.length === 0) return null;
  return [...dates].sort().at(-1)!;
}

export function careEventRecapSubtitleKey(eventType: PlantCareEventType): string {
  return `plants.care.${eventType}`;
}
