import {
  cookbookToWire,
  cookbookWireSchema,
  type CookbookWire,
} from "@/domain/cookbook";
import type { CookbookUseCases } from "./cookbooks/cookbook-use-cases";
import type { CookbookRepository } from "./ports/cookbook-repository";
import type { CookbookRemoteStore } from "./ports/cookbook-remote-store";
import { createQuoteSyncEngine } from "./sync/quote-sync-engine";

export type CookbookSyncApply = Pick<CookbookUseCases, "applyRemote">;

export function createCookbookSyncEngine(deps: {
  repository: CookbookRepository;
  meta: import("./ports/item-repository").ItemRepository["meta"];
  remote: CookbookRemoteStore;
  cookbooks: CookbookSyncApply;
  pullLimit: number;
  sleep: (ms: number) => Promise<void>;
}) {
  const remote = {
    push: (wires: CookbookWire[]) => deps.remote.push(wires),
    pull: async (since: string | null, limit: number) => {
      const page = await deps.remote.pull(since, limit);
      return { quotes: page.cookbooks, cursor: page.cursor };
    },
  };

  function zodIssueMessage(parsed: ReturnType<typeof cookbookWireSchema.safeParse>): string {
    if (parsed.success) return "";
    return parsed.error.issues
      .map((issue) =>
        issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
      )
      .join("; ");
  }

  return createQuoteSyncEngine({
    repository: deps.repository,
    meta: deps.meta,
    remote,
    quotes: deps.cookbooks,
    pullLimit: deps.pullLimit,
    sleep: deps.sleep,
    pullCursorMetaKey: "cookbookPullCursor",
    toWire: (cookbook) => cookbookToWire(cookbook),
    safeParseWire: (wire) => {
      const parsed = cookbookWireSchema.safeParse(wire);
      if (parsed.success) return { success: true, data: parsed.data };
      return { success: false, message: zodIssueMessage(parsed) };
    },
  });
}
