import { buildItemDeepLink } from "@/application/suggestions/deep-links";
import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { makeCandidate } from "@/application/suggestions/contributors/shared";
import { maxLocalDate } from "@/application/suggestions/calendar";

export const musicPracticeStaleContributor: DomainStaleContributor = {
  domainId: "music_practice",
  async listStaleCandidates(deps, ctx) {
    const ports = deps.musicPractice;
    if (ports === undefined) return [];

    const [compositions, djSets, plans, logs] = await Promise.all([
      ports.listCompositions(),
      ports.listDjSets(),
      ports.listPracticePlans(),
      ports.listPracticeLogs(),
    ]);

    const candidates = [];

    for (const row of compositions) {
      if (row.deletedAt !== null) continue;
      if (row.status !== "idea" && row.status !== "in_progress") continue;
      const anchor =
        row.lastSessionAt?.slice(0, 10) ??
        row.statusUpdatedAt?.slice(0, 10) ??
        ctx.calendarDay;
      const candidate = makeCandidate(
        {
          domainId: "music_practice",
          itemId: row.id,
          kind: "advance_composition",
          title: row.title,
          subtitle: null,
          staleAnchorDate: anchor,
          deepLink: buildItemDeepLink("music_practice", row.id),
          primaryActionKey: "suggestions.action.open",
          minStaleDays: 14,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    for (const row of djSets) {
      if (row.deletedAt !== null || row.status !== "planned" || row.performedAt) continue;
      const anchor =
        (row.plannedDate && row.plannedDate < ctx.calendarDay ? row.plannedDate : null) ??
        row.statusUpdatedAt?.slice(0, 10) ??
        ctx.calendarDay;
      const candidate = makeCandidate(
        {
          domainId: "music_practice",
          itemId: row.id,
          kind: "prepare_dj_set",
          title: row.title,
          subtitle: null,
          staleAnchorDate: anchor,
          deepLink: buildItemDeepLink("music_practice", row.id),
          primaryActionKey: "suggestions.action.open",
          minStaleDays: 14,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    for (const plan of plans) {
      if (plan.deletedAt !== null || !plan.active) continue;
      const planLogs = logs.filter(
        (log) => log.deletedAt === null && log.planId === plan.id,
      );
      const lastPractice = planLogs
        .map((log) => log.practicedAt.slice(0, 10))
        .sort()
        .at(-1);
      const anchor = lastPractice ?? plan.startedAt?.slice(0, 10) ?? ctx.calendarDay;
      const candidate = makeCandidate(
        {
          domainId: "music_practice",
          itemId: plan.id,
          kind: "practice_session",
          title: plan.instrument,
          subtitle: null,
          staleAnchorDate: anchor,
          deepLink: buildItemDeepLink("music_practice", plan.id),
          primaryActionKey: "suggestions.action.open",
          minStaleDays: 7,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    return candidates;
  },
};
