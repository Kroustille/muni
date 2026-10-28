import type { RecapAchievement } from "@/domain/recap";
import { recapDateInRange } from "@/application/recap/period";
import type { DomainRecapContributor } from "@/application/recap/contributor-types";

function practiceSubtitle(row: {
  practiceKind: "structured" | "improvisation";
  instrumentName?: string | null;
  exerciseTitles?: string[];
  learningPieceTitle?: string | null;
}): string | undefined {
  const parts: string[] = [];
  if (row.practiceKind === "improvisation") {
    parts.push("Improvisation");
  } else {
    parts.push("Séance de pratique");
  }
  if (row.learningPieceTitle) parts.push(row.learningPieceTitle);
  else if (row.exerciseTitles?.length) parts.push(row.exerciseTitles.join(", "));
  if (row.instrumentName) parts.push(row.instrumentName);
  return parts.length > 1 ? parts.slice(1).join(" · ") : parts[0];
}

export const musicPracticeRecapContributor: DomainRecapContributor = {
  domainId: "music_track",
  async collectAchievements(deps, range) {
    const [compositions, djSets, logs] = await Promise.all([
      deps.musicPractice.listCompositions(),
      deps.musicPractice.listDjSets(),
      deps.musicPractice.listPracticeLogs(),
    ]);
    const achievements: RecapAchievement[] = [];
    const seenLogIds = new Set<string>();

    for (const row of compositions) {
      if (row.deletedAt != null || row.status !== "finished" || row.finishedAt == null) continue;
      if (!recapDateInRange(row.finishedAt, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "music_track",
        occurredOn: row.finishedAt,
        sortInstant: `${row.finishedAt}T12:00:00.000Z`,
        title: row.title,
        subtitle: "Composition terminée",
        musicLineKind: "composition_finished",
        sourceCompositionId: row.id,
      });
    }

    for (const row of djSets) {
      if (row.deletedAt != null || row.status !== "performed" || row.performedAt == null) continue;
      if (!recapDateInRange(row.performedAt, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "music_track",
        occurredOn: row.performedAt,
        sortInstant: `${row.performedAt}T12:00:00.000Z`,
        title: row.title,
        subtitle: "Set joué",
        musicLineKind: "dj_performed",
        sourceDjSetId: row.id,
      });
    }

    for (const row of logs) {
      if (row.deletedAt != null) continue;
      if (seenLogIds.has(row.id)) continue;
      seenLogIds.add(row.id);
      if (!recapDateInRange(row.practicedAt, range.startDate, range.endDate)) continue;
      achievements.push({
        domainId: "music_track",
        occurredOn: row.practicedAt,
        sortInstant: `${row.practicedAt}T12:00:00.000Z`,
        title: row.learningPieceTitle ?? row.exerciseTitles?.[0] ?? "Pratique",
        subtitle: practiceSubtitle(row),
        musicLineKind:
          row.practiceKind === "improvisation" ? "improvisation" : "practice_session",
        sourcePracticeLogId: row.id,
      });
    }

    return achievements;
  },
};
