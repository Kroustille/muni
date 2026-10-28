import type {
  MusicPracticePullResult,
  MusicPracticeRemoteStore,
  MusicPracticeSyncPayload,
} from "@/application/ports/music-practice-remote-store";
import { mergeDjSet } from "@/domain/dj-set";
import { mergeLearningPiece } from "@/domain/learning-piece";
import { mergeMusicComposition } from "@/domain/music-composition";
import { mergePracticeExercise } from "@/domain/practice-exercise";
import { mergePracticeInstrument } from "@/domain/practice-instrument";
import { mergePracticeLog } from "@/domain/practice-log";
import { mergePracticePlan } from "@/domain/practice-plan";

function mergePayload(
  existing: MusicPracticeSyncPayload,
  incoming: MusicPracticeSyncPayload,
): MusicPracticeSyncPayload {
  const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
  const mergeList = <T extends { id: string }>(
    current: T[],
    patch: T[],
    merge: (a: T, b: T) => T,
  ): T[] => {
    const map = byId(current);
    for (const row of patch) {
      const prev = map.get(row.id);
      map.set(row.id, prev === undefined ? row : merge(prev, row));
    }
    return [...map.values()];
  };
  return {
    compositions: mergeList(existing.compositions, incoming.compositions, mergeMusicComposition),
    djSets: mergeList(existing.djSets, incoming.djSets, mergeDjSet),
    instruments: mergeList(existing.instruments, incoming.instruments, mergePracticeInstrument),
    exercises: mergeList(existing.exercises, incoming.exercises, mergePracticeExercise),
    plans: mergeList(existing.plans, incoming.plans, mergePracticePlan),
    logs: mergeList(existing.logs, incoming.logs, mergePracticeLog),
    learningPieces: mergeList(
      existing.learningPieces,
      incoming.learningPieces,
      mergeLearningPiece,
    ),
  };
}

const emptyPayload = (): MusicPracticeSyncPayload => ({
  compositions: [],
  djSets: [],
  instruments: [],
  exercises: [],
  plans: [],
  logs: [],
  learningPieces: [],
});

export class InMemoryMusicPracticeRemoteStore implements MusicPracticeRemoteStore {
  private state: MusicPracticeSyncPayload = emptyPayload();
  private clock = 0;

  private nextCursor(): string {
    this.clock += 1;
    return new Date(Date.UTC(2026, 0, 1, 0, 0, this.clock)).toISOString();
  }

  seed(payload: MusicPracticeSyncPayload): void {
    this.state = mergePayload(this.state, payload);
  }

  snapshot(): MusicPracticeSyncPayload {
    return structuredClone(this.state);
  }

  async push(body: MusicPracticeSyncPayload): Promise<MusicPracticePullResult> {
    this.state = mergePayload(this.state, body);
    return { ...structuredClone(this.state), cursor: this.nextCursor() };
  }

  async pull(_since: string | null, _limit: number): Promise<MusicPracticePullResult> {
    return { ...structuredClone(this.state), cursor: this.nextCursor() };
  }
}
