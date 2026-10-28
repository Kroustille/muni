import { MusicPracticeHubTabs } from "@/components/music-practice/hub-tabs";

export default function MusicPracticeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <MusicPracticeHubTabs />
      {children}
    </div>
  );
}
