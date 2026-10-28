import { formatHlc, parseHlc, receiveHlc, tickHlc, type Hlc } from "@/domain/clock";
import {
  newCookbook,
  upsertCookbookFields,
  type Cookbook,
  type UpsertCookbookInput,
} from "@/domain/cookbook";
import type { CookbookRepository } from "@/application/ports/cookbook-repository";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { ItemRepository } from "@/application/ports/item-repository";

export type UpsertCookbookDeps = {
  repository: CookbookRepository;
  meta: ItemRepository["meta"];
  idGenerator: IdGenerator;
  now: () => number;
};

export function createUpsertCookbook(deps: UpsertCookbookDeps) {
  async function deviceId(): Promise<string> {
    const existing = await deps.meta.get("deviceId");
    if (existing !== undefined) return existing;
    const created = deps.idGenerator.newId();
    await deps.meta.set("deviceId", created);
    return created;
  }

  async function loadClock(): Promise<Hlc | null> {
    const state = await deps.meta.get("hlcState");
    return state === undefined ? null : parseHlc(state);
  }

  async function nextStamp(): Promise<string> {
    const next = tickHlc(await loadClock(), await deviceId(), deps.now());
    const stamp = formatHlc(next);
    await deps.meta.set("hlcState", stamp);
    return stamp;
  }

  return {
    async upsertCookbook(input: UpsertCookbookInput): Promise<Cookbook> {
      const createdAt = new Date(deps.now()).toISOString();
      const existing =
        input.id !== undefined ? await deps.repository.get(input.id) : undefined;
      const resolvedId = input.id ?? existing?.id ?? deps.idGenerator.newId();
      const merged = upsertCookbookFields(existing, { ...input, id: resolvedId }, createdAt);
      const stamp = await nextStamp();
      const fieldsUpdatedAt: Record<string, string> = { ...merged.fieldsUpdatedAt };
      if (existing === undefined) {
        fieldsUpdatedAt.title = stamp;
      } else {
        if (existing.title !== merged.title) fieldsUpdatedAt.title = stamp;
        if (existing.author !== merged.author) fieldsUpdatedAt.author = stamp;
        if (existing.isbn !== merged.isbn) fieldsUpdatedAt.isbn = stamp;
      }
      const toSave =
        existing === undefined
          ? newCookbook({
              id: input.id ?? deps.idGenerator.newId(),
              title: merged.title,
              author: merged.author,
              isbn: merged.isbn,
              createdAt,
            })
          : { ...merged, fieldsUpdatedAt };
      const stamped: Cookbook = {
        ...toSave,
        id: resolvedId,
        fieldsUpdatedAt,
      };
      return deps.repository.upsert(stamped);
    },
  };
}

export type UpsertCookbookUseCase = ReturnType<typeof createUpsertCookbook>;
