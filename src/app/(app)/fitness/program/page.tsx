"use client";

import { useEffect, useState } from "react";
import { ProgramEditor } from "@/components/fitness/program-editor";
import { getFitnessProgramUseCases } from "@/composition/client";
import type { PlannedSession } from "@/domain/fitness/program";
import { t } from "@/i18n";

export default function FitnessProgramPage() {
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState<PlannedSession[]>([]);
  const [programId, setProgramId] = useState<string | null>(null);

  useEffect(() => {
    void getFitnessProgramUseCases().then(async (uc) => {
      const active = await uc.getActiveProgram();
      if (active) {
        setProgramId(active.id);
        setName(active.name);
        setSessions(active.plannedSessions);
      }
    });
  }, []);

  const save = async () => {
    const uc = await getFitnessProgramUseCases();
    if (programId === null) {
      await uc.createProgram({ name, plannedSessions: sessions });
    } else {
      await uc.updateProgram(programId, { name, plannedSessions: sessions });
    }
    window.location.assign("/fitness");
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 font-serif text-2xl font-semibold">{t("fitness.program.title")}</h1>
      <ProgramEditor
        name={name}
        sessions={sessions}
        onNameChange={setName}
        onSessionsChange={setSessions}
        onSave={save}
      />
    </div>
  );
}
