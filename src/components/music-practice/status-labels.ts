import type { MusicCompositionStatus } from "@/domain/music-composition";
import type { DjSetStatus } from "@/domain/dj-set";
import type { LearningPieceStatus } from "@/domain/learning-piece";
import { t, type MessageKey } from "@/i18n";

const COMPOSITION_STATUS_KEYS: Record<MusicCompositionStatus, MessageKey> = {
  idea: "musicPractice.status.composition.idea",
  in_progress: "musicPractice.status.composition.in_progress",
  paused: "musicPractice.status.composition.paused",
  finished: "musicPractice.status.composition.finished",
  archived: "musicPractice.status.composition.archived",
};

const DJ_STATUS_KEYS: Record<DjSetStatus, MessageKey> = {
  planned: "musicPractice.status.dj.planned",
  performed: "musicPractice.status.dj.performed",
  cancelled: "musicPractice.status.dj.cancelled",
};

const PIECE_STATUS_KEYS: Record<LearningPieceStatus, MessageKey> = {
  learning: "musicPractice.status.piece.learning",
  comfortable: "musicPractice.status.piece.comfortable",
  paused: "musicPractice.status.piece.paused",
  archived: "musicPractice.status.piece.archived",
};

export function compositionStatusLabel(status: MusicCompositionStatus): string {
  return t(COMPOSITION_STATUS_KEYS[status]);
}

export function djSetStatusLabel(status: DjSetStatus): string {
  return t(DJ_STATUS_KEYS[status]);
}

export function learningPieceStatusLabel(status: LearningPieceStatus): string {
  return t(PIECE_STATUS_KEYS[status]);
}
