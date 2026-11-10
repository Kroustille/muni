import { HubEmptyState, HubPage } from "@/components/memories/hub-page";
import { SOUVENIRS_TABS } from "@/components/memories/hub-tabs";

export default function SouvenirsListPage() {
  return (
    <HubPage titleKey="memories.title" tabs={SOUVENIRS_TABS}>
      <HubEmptyState messageKey="memories.list.empty" testId="memories-list-empty" />
    </HubPage>
  );
}
