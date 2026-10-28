"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getItemUseCases, getLearningPieceUseCases, getPracticeLogUseCases } from "@/composition/client";
import type { Item } from "@/domain/item";
import type { LearningPiece, LearningPieceStatus } from "@/domain/learning-piece";
import { learningPieceStatusLabel } from "@/components/music-practice/status-labels";
import { t } from "@/i18n";
import { TrackLinkPicker } from "@/components/music-practice/track-link-picker";

export function LearningPieceDetail({ id }: { id: string }) {
  const [piece, setPiece] = useState<LearningPiece | undefined>();
  const [tracks, setTracks] = useState<Item[]>([]);

  const refresh = async () => {
    const uc = await getLearningPieceUseCases();
    setPiece(await uc.getLearningPiece(id));
    const items = await getItemUseCases();
    setTracks(await items.listItems("music_track"));
  };

  useEffect(() => {
    void refresh();
  }, [id]);

  if (piece === undefined) return <p className="text-sm text-muted">…</p>;

  const deleted = piece.deletedAt !== null;

  return (
    <div className="space-y-4" data-testid="learning-piece-detail">
      <Link href="/music-practice/apprentissage#repertoire" className="text-sm text-accent">
        ← {t("musicPractice.apprentissage.repertoire")}
      </Link>
      <h1 className="text-xl font-semibold">{piece.title}</h1>

      {deleted && (
        <button
          type="button"
          onClick={async () => {
            const uc = await getLearningPieceUseCases();
            setPiece(await uc.restoreLearningPiece(id));
          }}
          data-testid="learning-piece-restore"
        >
          {t("musicPractice.restore")}
        </button>
      )}

      <select
        value={piece.status}
        disabled={deleted}
        onChange={async (e) => {
          const uc = await getLearningPieceUseCases();
          setPiece(await uc.updatePiece(id, { status: e.target.value as LearningPieceStatus }));
        }}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        data-testid="learning-piece-status"
      >
        {(["learning", "comfortable", "paused", "archived"] as LearningPieceStatus[]).map((status) => (
          <option key={status} value={status}>
            {learningPieceStatusLabel(status)}
          </option>
        ))}
      </select>

      <TrackLinkPicker
        value={piece.linkedTrackId}
        tracks={tracks}
        onChange={async (trackId) => {
          const uc = await getLearningPieceUseCases();
          setPiece(await uc.updatePiece(id, { linkedTrackId: trackId }));
        }}
        testId="learning-piece-track-picker"
      />

      <button
        type="button"
        className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground"
        onClick={async () => {
          const logUc = await getPracticeLogUseCases();
          await logUc.markDoneToday({ exerciseIds: [], learningPieceId: id });
          await refresh();
        }}
        data-testid="learning-piece-practice-log"
      >
        {t("musicPractice.markDone")}
      </button>
    </div>
  );
}
