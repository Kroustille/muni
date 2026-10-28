import { buildFitnessSkipDeepLink, buildItemDeepLink } from "@/application/suggestions/deep-links";
import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { makeCandidate } from "@/application/suggestions/contributors/shared";

export const fitnessStaleContributor: DomainStaleContributor = {
  domainId: "fitness",
  async listStaleCandidates(deps, ctx) {
    if (
      deps.fitnessPrograms === undefined ||
      deps.fitnessWorkouts === undefined ||
      deps.fitnessSkips === undefined
    ) {
      return [];
    }

    const program = await deps.fitnessPrograms.getActive();
    if (program === undefined || program.deletedAt !== null) {
      return [];
    }

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
      program.fieldsUpdatedAt.isActive?.slice(0, 10) ??
      ctx.calendarDay;

    const resumeCandidate = makeCandidate(
      {
        domainId: "fitness",
        itemId: program.id,
        kind: "resume_training",
        title: program.name,
        subtitle: null,
        staleAnchorDate: resumeAnchor,
        deepLink: buildItemDeepLink("fitness", program.id),
        primaryActionKey: "suggestions.action.train",
        minStaleDays: 7,
      },
      ctx.calendarDay,
    );
    if (resumeCandidate) candidates.push(resumeCandidate);

    for (const skip of skips) {
      if (skip.deletedAt !== null) continue;
      const session = program.plannedSessions.find((s) => s.id === skip.plannedSessionId);
      const candidate = makeCandidate(
        {
          domainId: "fitness",
          itemId: skip.id,
          kind: "unblock_skipped",
          title: session?.title ?? program.name,
          subtitle: null,
          staleAnchorDate: skip.calendarDate,
          deepLink: buildFitnessSkipDeepLink(program.id),
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
