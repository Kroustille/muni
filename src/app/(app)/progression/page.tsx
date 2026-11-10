import { HubEmptyState, HubPage } from "@/components/memories/hub-page";
import { PROGRESSION_TABS } from "@/components/memories/hub-tabs";

export default function ProgressionGoalsPage() {
  return (
    <HubPage titleKey="progression.title" tabs={PROGRESSION_TABS}>
      <HubEmptyState messageKey="progression.goals.empty" testId="progression-goals-empty" />
    </HubPage>
  );
}
