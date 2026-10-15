import type { IdGenerator } from "@/application/ports/id-generator";

export function createUuidIdGenerator(): IdGenerator {
  return { newId: () => crypto.randomUUID() };
}
