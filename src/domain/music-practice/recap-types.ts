export type MusicCompositionRecapRow = {
  id: string;
  title: string;
  status: "idea" | "in_progress" | "paused" | "finished" | "archived";
  finishedAt: string | null;
  deletedAt: string | null;
};

export type DjSetRecapRow = {
  id: string;
  title: string;
  status: "planned" | "performed" | "cancelled";
  performedAt: string | null;
  deletedAt: string | null;
};

export type PracticeLogRecapRow = {
  id: string;
  practicedAt: string;
  practiceKind: "structured" | "improvisation";
  deletedAt: string | null;
  instrumentName?: string | null;
  exerciseTitles?: string[];
  learningPieceTitle?: string | null;
};
