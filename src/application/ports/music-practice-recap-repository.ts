import type {
  DjSetRecapRow,
  MusicCompositionRecapRow,
  PracticeLogRecapRow,
} from "@/domain/music-practice/recap-types";

export type MusicPracticeRecapRepository = {
  listCompositions(): Promise<MusicCompositionRecapRow[]>;
  listDjSets(): Promise<DjSetRecapRow[]>;
  listPracticeLogs(): Promise<PracticeLogRecapRow[]>;
};

export const emptyMusicPracticeRecapRepository: MusicPracticeRecapRepository = {
  async listCompositions() {
    return [];
  },
  async listDjSets() {
    return [];
  },
  async listPracticeLogs() {
    return [];
  },
};
