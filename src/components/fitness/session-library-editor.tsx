"use client";

import { useState } from "react";
import type { FitnessSessionTemplate, TemplateExercise } from "@/domain/fitness/session-template";
import { ExercisePicker } from "@/components/fitness/exercise-picker";
import {
  exerciseNameFromCatalog,
  useExerciseCatalogMap,
} from "@/components/fitness/use-exercise-catalog";
import { rememberExerciseId } from "@/application/fitness/recent-exercises";
import { useUndoDelete } from "@/components/UndoToast";
import { t } from "@/i18n";

type DraftTemplate = {
  id: string;
  title: string;
  sortOrder: number;
  templateExercises: TemplateExercise[];
  isNew: boolean;
};

export type SessionLibraryEditorProps = {
  templates: DraftTemplate[];
  onTemplatesChange: (templates: DraftTemplate[]) => void;
  onSave: () => void;
  onReload?: () => void;
};

export function SessionLibraryEditor({
  templates,
  onTemplatesChange,
  onSave,
  onReload,
}: SessionLibraryEditorProps) {
  const [pickerTemplateId, setPickerTemplateId] = useState<string | null>(null);
  const catalogById = useExerciseCatalogMap();
  const { deleteFitnessTemplateWithUndo } = useUndoDelete();

  const addTemplate = () => {
    onTemplatesChange([
      ...templates,
      {
        id: crypto.randomUUID(),
        title: "Séance",
        sortOrder: templates.length,
        templateExercises: [],
        isNew: true,
      },
    ]);
  };

  const updateTemplate = (
    id: string,
    patch: Partial<Pick<DraftTemplate, "title" | "templateExercises">>,
  ) => {
    onTemplatesChange(templates.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeTemplate = (template: DraftTemplate) => {
    if (template.isNew) {
      onTemplatesChange(templates.filter((row) => row.id !== template.id));
      return;
    }
    void deleteFitnessTemplateWithUndo(template.id, { onRestored: () => onReload?.() }).then(() => {
      onTemplatesChange(templates.filter((row) => row.id !== template.id));
    });
  };

  const removeExercise = (templateId: string, exerciseIndex: number) => {
    const row = templates.find((s) => s.id === templateId);
    if (row === undefined) return;
    updateTemplate(templateId, {
      templateExercises: row.templateExercises.filter((_, index) => index !== exerciseIndex),
    });
  };

  return (
    <div className="space-y-4" data-testid="fitness-session-library-editor">
      {templates.map((template) => (
        <section key={template.id} className="rounded-xl border border-border p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <label className="block flex-1 text-sm">
              <span className="text-muted">{t("fitness.sessions.templateTitle")}</span>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium"
                value={template.title}
                onChange={(e) => updateTemplate(template.id, { title: e.target.value })}
                data-testid="fitness-session-template-title"
              />
            </label>
            <button
              type="button"
              className="shrink-0 text-xs text-destructive"
              data-testid="fitness-session-template-delete"
              onClick={() => removeTemplate(template)}
            >
              {t("action.delete")}
            </button>
          </div>
          <ul className="mb-2 mt-2 space-y-1">
            {template.templateExercises.map((ex, index) => (
              <li
                key={`${template.id}-${ex.exerciseId}-${index}`}
                className="flex items-center justify-between gap-2 text-sm text-foreground"
              >
                <span data-testid={`fitness-session-exercise-label-${ex.exerciseId}`}>
                  {exerciseNameFromCatalog(catalogById, ex.exerciseId)}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-destructive"
                  data-testid="fitness-session-template-exercise-remove"
                  aria-label={t("fitness.sessions.removeExercise")}
                  onClick={() => removeExercise(template.id, index)}
                >
                  {t("fitness.sessions.removeExercise")}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-sm text-accent"
            onClick={() => setPickerTemplateId(template.id)}
          >
            {t("fitness.workout.addExercise")}
          </button>
        </section>
      ))}
      <button type="button" className="text-sm text-accent" onClick={addTemplate}>
        {t("fitness.sessions.addTemplate")}
      </button>
      <button
        type="button"
        className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground"
        onClick={onSave}
        data-testid="fitness-session-library-save"
      >
        {t("fitness.action.save")}
      </button>
      <ExercisePicker
        open={pickerTemplateId !== null}
        onClose={() => setPickerTemplateId(null)}
        onSelect={(entry) => {
          if (pickerTemplateId === null) return;
          rememberExerciseId(entry.id);
          const row = templates.find((s) => s.id === pickerTemplateId);
          if (row === undefined) return;
          updateTemplate(pickerTemplateId, {
            templateExercises: [...row.templateExercises, { exerciseId: entry.id }],
          });
        }}
      />
    </div>
  );
}

export function draftsFromTemplates(rows: FitnessSessionTemplate[]): DraftTemplate[] {
  return rows
    .filter((t) => t.deletedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({
      id: t.id,
      title: t.title,
      sortOrder: t.sortOrder,
      templateExercises: t.templateExercises,
      isNew: false,
    }));
}
