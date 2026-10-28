"use client";

import Link from "next/link";
import type { RecapAchievement, RecapDomainId, RecapSection } from "@/domain/recap";
import { monthLabelForAchievement } from "@/application/recap/period";
import { t, type MessageKey } from "@/i18n";

const SECTION_KEY: Record<RecapDomainId, MessageKey> = {
  book: "recap.section.book",
  movie: "recap.section.movie",
  music_track: "recap.section.music_track",
  recipe: "recap.section.recipe",
  fitness: "recap.section.fitness",
  plants: "recap.section.plants",
};

const MUSIC_LINE_KEY: Record<
  NonNullable<RecapAchievement["musicLineKind"]>,
  MessageKey
> = {
  listened: "recap.music.line.listened",
  composition_finished: "recap.music.line.compositionFinished",
  dj_performed: "recap.music.line.djPerformed",
  practice_session: "recap.music.line.practiceSession",
  improvisation: "recap.music.line.improvisation",
};

function lineSubtitle(achievement: RecapAchievement, showMonth: boolean): string {
  const parts: string[] = [];
  if (showMonth) parts.push(monthLabelForAchievement(achievement.occurredOn));
  if (achievement.domainId === "music_track" && achievement.musicLineKind) {
    parts.push(t(MUSIC_LINE_KEY[achievement.musicLineKind]));
  } else if (achievement.subtitle) {
    parts.push(achievement.subtitle);
  }
  parts.push(achievement.occurredOn);
  return parts.filter(Boolean).join(" · ");
}

type RecapDomainSectionsProps = {
  sections: RecapSection[];
  yearGranularity: boolean;
};

export function RecapDomainSections({ sections, yearGranularity }: RecapDomainSectionsProps) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.domainId} aria-label={t(SECTION_KEY[section.domainId])}>
          <h2 className="mb-2 text-lg font-medium">
            {t(SECTION_KEY[section.domainId])} ({section.count})
          </h2>
          <ul className="flex flex-col gap-2">
            {section.achievements.map((achievement) => {
              const subtitle = lineSubtitle(achievement, yearGranularity);
              const content = (
                <>
                  <span className="font-medium">{achievement.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{subtitle}</span>
                </>
              );
              return (
                <li
                  key={achievementKey(achievement)}
                  className="rounded-xl border border-border bg-surface px-3 py-2"
                >
                  {achievement.deepLinkHref ? (
                    <Link href={achievement.deepLinkHref} className="block hover:underline">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function achievementKey(achievement: RecapAchievement): string {
  return [
    achievement.domainId,
    achievement.occurredOn,
    achievement.sourceItemId,
    achievement.sourceWorkoutId,
    achievement.sourceCompositionId,
    achievement.sourceDjSetId,
    achievement.sourcePracticeLogId,
    achievement.sourcePlantCareEventId,
    achievement.sourceVegetableMilestoneId,
    achievement.title,
  ]
    .filter(Boolean)
    .join(":");
}

export function RecapEmptyState() {
  return (
    <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-muted">
      {t("recap.empty")}
    </p>
  );
}
