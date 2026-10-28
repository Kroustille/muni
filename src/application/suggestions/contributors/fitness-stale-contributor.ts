import { buildFitnessSkipDeepLink, buildItemDeepLink } from "@/application/suggestions/deep-links";
import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { makeCandidate } from "@/application/suggestions/contributors/shared";

export const fitnessStaleContributor: DomainStaleContributor = {
  domainId: "fitness",
  async listStaleCandidates(deps, ctx) {
    if (
      deps.fitnessSessionTemplates === undefined ||
      deps.fitnessWorkouts === undefined ||
      deps.fitnessSkips === undefined
    ) {
      return [];
    }

    const templates = (await deps.fitnessSessionTemplates.list()).filter((t) => t.deletedAt === null);
    if (templates.length === 0) {
      return [];
    }

    const primary = templates[0]!;

    const [logs, skips] = await Promise.all([
      deps.fitnessWorkouts.list(),
      deps.fitnessSkips.list(),
    ]);

    const candidates = [];

    const completed = logs.filter(
      (log) => log.deletedAt === null && log.status === "completed",
    );
    const lastCompletedDate = completed.map((log) => log.calendarDate).sort().at(-1);
    const resumeAnchor =
      lastCompletedDate ??
      primary.fieldsUpdatedAt.title?.slice(0, 10) ??
      ctx.calendarDay;

    const resumeCandidate = makeCandidate(
      {
        domainId: "fitness",
        itemId: primary.id,
        kind: "resume_training",
        title: primary.title,
        subtitle: null,
        staleAnchorDate: resumeAnchor,
        deepLink: buildItemDeepLink("fitness", primary.id),
        primaryActionKey: "suggestions.action.train",
        minStaleDays: 7,
      },
      ctx.calendarDay,
    );
    if (resumeCandidate) candidates.push(resumeCandidate);

    const templateById = new Map(templates.map((t) => [t.id, t]));

    for (const skip of skips) {
      if (skip.deletedAt !== null) continue;
      const template =
        skip.sessionTemplateId === null
          ? undefined
          : templateById.get(skip.sessionTemplateId);
      const candidate = makeCandidate(
        {
          domainId: "fitness",
          itemId: skip.id,
          kind: "unblock_skipped",
          title: template?.title ?? primary.title,
          subtitle: null,
          staleAnchorDate: skip.calendarDate,
          deepLink: buildFitnessSkipDeepLink(skip.id),
          primaryActionKey: "suggestions.action.train",
          minStaleDays: 3,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    return candidates;
  },
};
