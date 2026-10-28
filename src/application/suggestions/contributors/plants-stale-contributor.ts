import { buildItemDeepLink } from "@/application/suggestions/deep-links";
import type { DomainStaleContributor } from "@/application/suggestions/contributors/shared";
import { makeCandidate } from "@/application/suggestions/contributors/shared";
import { maxLocalDate } from "@/application/suggestions/calendar";

export const plantsStaleContributor: DomainStaleContributor = {
  domainId: "plants",
  async listStaleCandidates(deps, ctx) {
    const ports = deps.plants;
    if (ports === undefined) return [];

    const [plants, events, cultures] = await Promise.all([
      ports.listPlants(),
      ports.listCareEvents(),
      ports.listVegetableCultures(),
    ]);

    const candidates = [];

    for (const plant of plants) {
      if (plant.deletedAt !== null) continue;
      const waterEvents = events.filter(
        (event) =>
          event.deletedAt === null &&
          event.plantId === plant.id &&
          event.eventType === "water",
      );
      const anchor =
        waterEvents.length > 0
          ? maxLocalDate(...waterEvents.map((e) => e.occurredAt.slice(0, 10)))
          : plant.createdAt.slice(0, 10);
      const candidate = makeCandidate(
        {
          domainId: "plants",
          itemId: plant.id,
          kind: "water_plant",
          title: plant.name,
          subtitle: null,
          staleAnchorDate: anchor,
          deepLink: buildItemDeepLink("plants", plant.id),
          primaryActionKey: "suggestions.action.open",
          minStaleDays: 7,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    for (const culture of cultures) {
      if (culture.deletedAt !== null) continue;
      const anchor = culture.lastMilestoneAt?.slice(0, 10) ?? culture.createdAt.slice(0, 10);
      const candidate = makeCandidate(
        {
          domainId: "plants",
          itemId: culture.id,
          kind: "potager_milestone",
          title: culture.name,
          subtitle: null,
          staleAnchorDate: anchor,
          deepLink: buildItemDeepLink("plants", culture.id),
          primaryActionKey: "suggestions.action.open",
          minStaleDays: 14,
        },
        ctx.calendarDay,
      );
      if (candidate) candidates.push(candidate);
    }

    return candidates;
  },
};
