"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getLearningPieceUseCases,
  getPracticeExerciseUseCases,
  getPracticeInstrumentUseCases,
  getPracticeLogUseCases,
  getPracticePlanUseCases,
} from "@/composition/client";
import { hydrateTodayExercises, resolveTodayExercises } from "@/application/music-practice/practice-today";
import { localCalendarDate } from "@/domain/music-practice-dates";
import { learningPieceStatusLabel } from "@/components/music-practice/status-labels";
import type { LearningPiece } from "@/domain/learning-piece";
import type { PracticeExercise } from "@/domain/practice-exercise";
import type { PracticeInstrument } from "@/domain/practice-instrument";
import type { PracticeLog } from "@/domain/practice-log";
import { normalizeText } from "@/domain/text";
import { t } from "@/i18n";
import { PlanEditor } from "@/components/music-practice/plan-editor";

export function ApprentissageHub() {
  const [instruments, setInstruments] = useState<PracticeInstrument[]>([]);
  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [pieces, setPieces] = useState<LearningPiece[]>([]);
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [todayRows, setTodayRows] = useState<{ exercise: PracticeExercise; assignmentId: string }[]>([]);
  const [instrumentName, setInstrumentName] = useState("");
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [pieceTitle, setPieceTitle] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [pieceSearch, setPieceSearch] = useState("");

  const refresh = async () => {
    const instrumentUc = await getPracticeInstrumentUseCases();
    const exerciseUc = await getPracticeExerciseUseCases();
    const pieceUc = await getLearningPieceUseCases();
    const logUc = await getPracticeLogUseCases();
    const planUc = await getPracticePlanUseCases();

    const allInstruments = await instrumentUc.listInstruments();
    const allExercises = await exerciseUc.listExercises();
    const allPieces = await pieceUc.listLearningPieces();
    const allLogs = await logUc.listLogs();
    const plan = await planUc.getActivePlan();

    setInstruments(allInstruments.filter((row) => row.deletedAt === null));
    setExercises(allExercises.filter((row) => row.deletedAt === null));
    setPieces(allPieces.filter((row) => row.deletedAt === null));
    setLogs(allLogs.filter((row) => row.deletedAt === null).slice(0, 8));
    const today = resolveTodayExercises(plan, localCalendarDate());
    setTodayRows(hydrateTodayExercises(today, allExercises));
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredExercises = useMemo(() => {
    const q = normalizeText(exerciseSearch.trim());
    if (!q) return exercises;
    return exercises.filter((row) => normalizeText(row.title).includes(q));
  }, [exercises, exerciseSearch]);

  const filteredPieces = useMemo(() => {
    const q = normalizeText(pieceSearch.trim());
    if (!q) return pieces;
    return pieces.filter((row) => normalizeText(row.title).includes(q));
  }, [pieces, pieceSearch]);

  const instrumentLabel = (id: string | null) =>
    id === null ? "" : (instruments.find((row) => row.id === id)?.name ?? "");

  const markDone = async (exerciseId: string) => {
    const logUc = await getPracticeLogUseCases();
    const exercise = exercises.find((row) => row.id === exerciseId);
    await logUc.markDoneToday({
      exerciseIds: [exerciseId],
      instrumentId: exercise?.instrumentId ?? null,
    });
    await refresh();
  };

  return (
    <div className="space-y-8" data-testid="apprentissage-hub">
      <section id="today" className="space-y-3" data-testid="apprentissage-today">
        <h2 className="text-lg font-semibold">{t("musicPractice.apprentissage.today")}</h2>
        {todayRows.length === 0 ? (
          <p className="text-sm text-muted">—</p>
        ) : (
          <ul className="space-y-2">
            {todayRows.map(({ exercise }) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
              >
                <div>
                  <div className="font-medium">{exercise.title}</div>
                  {exercise.instrumentId && (
                    <div className="text-xs text-muted">{instrumentLabel(exercise.instrumentId)}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-accent px-3 py-1 text-sm text-accent-foreground"
                  onClick={() => void markDone(exercise.id)}
                  data-testid={`today-mark-done-${exercise.id}`}
                >
                  {t("musicPractice.markDone")}
                </button>
              </li>
            ))}
          </ul>
        )}
        {logs.length > 0 && (
          <ul className="text-sm text-muted">
            {logs.map((log) => (
              <li key={log.id} data-testid={`recent-log-${log.id}`}>
                {log.practicedAt} — {log.exerciseIds.length} ex.
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="plan">
        <PlanEditor />
      </section>

      <section id="exercises" className="space-y-3" data-testid="apprentissage-exercises">
        <h2 className="text-lg font-semibold">{t("musicPractice.apprentissage.exercises")}</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const trimmed = exerciseTitle.trim();
              if (!trimmed) return;
              const uc = await getPracticeExerciseUseCases();
              await uc.createQuick({ title: trimmed });
              setExerciseTitle("");
              await refresh();
            })();
          }}
        >
          <input
            value={exerciseTitle}
            onChange={(e) => setExerciseTitle(e.target.value)}
            placeholder={t("musicPractice.exercise.add")}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            data-testid="exercise-quick-add"
          />
          <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            {t("action.add")}
          </button>
        </form>
        <input
          type="search"
          value={exerciseSearch}
          onChange={(e) => setExerciseSearch(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          data-testid="exercise-search"
        />
        {filteredExercises.length === 0 ? (
          <p className="text-sm text-muted" data-testid="exercise-empty">
            {t("musicPractice.empty.exercises")}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredExercises.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/music-practice/apprentissage/exercises/${row.id}`}
                  className="block rounded-xl border border-border px-3 py-2"
                  data-testid={`exercise-row-${row.id}`}
                >
                  {row.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="repertoire" className="space-y-3" data-testid="apprentissage-repertoire">
        <h2 className="text-lg font-semibold">{t("musicPractice.apprentissage.repertoire")}</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const trimmed = pieceTitle.trim();
              if (!trimmed) return;
              const uc = await getLearningPieceUseCases();
              await uc.createPiece({ title: trimmed });
              setPieceTitle("");
              await refresh();
            })();
          }}
        >
          <input
            value={pieceTitle}
            onChange={(e) => setPieceTitle(e.target.value)}
            placeholder={t("musicPractice.piece.add")}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            data-testid="piece-quick-add"
          />
          <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            {t("action.add")}
          </button>
        </form>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const trimmed = instrumentName.trim();
              if (!trimmed) return;
              const uc = await getPracticeInstrumentUseCases();
              await uc.createQuick({ name: trimmed });
              setInstrumentName("");
              await refresh();
            })();
          }}
        >
          <input
            value={instrumentName}
            onChange={(e) => setInstrumentName(e.target.value)}
            placeholder={t("musicPractice.instrument.add")}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            data-testid="instrument-quick-add"
          />
          <button type="submit" className="rounded-lg border border-border px-3 py-2 text-sm">
            {t("action.add")}
          </button>
        </form>
        <input
          type="search"
          value={pieceSearch}
          onChange={(e) => setPieceSearch(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          data-testid="piece-search"
        />
        {filteredPieces.length === 0 ? (
          <p className="text-sm text-muted" data-testid="learning-piece-empty">
            {t("musicPractice.empty.learningPieces")}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredPieces.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/music-practice/apprentissage/pieces/${row.id}`}
                  className="block rounded-xl border border-border px-3 py-2"
                  data-testid={`learning-piece-row-${row.id}`}
                >
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-muted">
                    {learningPieceStatusLabel(row.status)}
                    {row.lastPracticedAt ? ` · ${row.lastPracticedAt}` : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
