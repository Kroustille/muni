import { HubEmptyState, HubPage } from "@/components/memories/hub-page";
import { PROGRESSION_TABS } from "@/components/memories/hub-tabs";

export default function ProgressionAchievementsPage() {
  return (
    <HubPage titleKey="progression.title" tabs={PROGRESSION_TABS}>
      <HubEmptyState
        messageKey="progression.achievements.empty"
        testId="progression-achievements-empty"
      />
    </HubPage>
  );
}
