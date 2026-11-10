import { HubEmptyState, HubPage } from "@/components/memories/hub-page";
import { SOUVENIRS_TABS } from "@/components/memories/hub-tabs";

export default function SouvenirsTimelinePage() {
  return (
    <HubPage titleKey="memories.title" tabs={SOUVENIRS_TABS}>
      <HubEmptyState messageKey="memories.timeline.empty" testId="memories-timeline-empty" />
    </HubPage>
  );
}
