"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SessionLibraryEditor,
  draftsFromTemplates,
  type SessionLibraryEditorProps,
} from "@/components/fitness/session-library-editor";
import { getFitnessSessionTemplateUseCases } from "@/composition/client";
import { t } from "@/i18n";

type DraftTemplate = SessionLibraryEditorProps["templates"][number];

export default function FitnessSessionsPage() {
  const [templates, setTemplates] = useState<DraftTemplate[]>([]);

  const loadTemplates = useCallback(async () => {
    const uc = await getFitnessSessionTemplateUseCases();
    const rows = await uc.listTemplates();
    setTemplates(draftsFromTemplates(rows));
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const save = async () => {
    const uc = await getFitnessSessionTemplateUseCases();
    const existing = await uc.listTemplates();
    const existingIds = new Set(existing.filter((t) => t.deletedAt === null).map((t) => t.id));

    for (const draft of templates) {
      if (draft.isNew || !existingIds.has(draft.id)) {
        await uc.createTemplate({
          title: draft.title,
          templateExercises: draft.templateExercises,
        });
      } else {
        await uc.updateTemplate(draft.id, {
          title: draft.title,
          templateExercises: draft.templateExercises,
          sortOrder: draft.sortOrder,
        });
      }
    }

    window.location.assign("/fitness");
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 font-serif text-2xl font-semibold">{t("fitness.sessions.title")}</h1>
      <SessionLibraryEditor
        templates={templates}
        onTemplatesChange={setTemplates}
        onSave={save}
        onReload={() => void loadTemplates()}
      />
    </div>
  );
}
