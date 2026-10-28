"use client";

import { useEffect, useState } from "react";
import type { Cookbook } from "@/domain/cookbook";
import { getCookbookUseCases } from "@/composition/client";
import { t } from "@/i18n";

export type RecipeSourceSectionProps = {
  cookbookId: string;
  sourcePage: string | null;
};

export function RecipeSourceSection({ cookbookId, sourcePage }: RecipeSourceSectionProps) {
  const [cookbook, setCookbook] = useState<Cookbook | undefined | null>(undefined);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void getCookbookUseCases().then(async (useCases) => {
      const refresh = async () => {
        const row = await useCases.getCookbook(cookbookId);
        if (!cancelled) setCookbook(row ?? null);
      };
      await refresh();
      unsubscribe = useCases.subscribe(() => {
        void refresh();
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [cookbookId]);

  if (cookbook === undefined) {
    return null;
  }

  const title =
    cookbook === null ? t("recipe.source.missingCookbook") : cookbook.title;
  const author = cookbook?.author?.trim();
  const isbn = cookbook?.isbn?.trim();
  const page = sourcePage?.trim();

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface/40 p-4">
      <h2 className="font-display text-lg text-foreground">{t("recipe.source.section")}</h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="sr-only">{t("recipe.source.cookbook")}</dt>
          <dd className="font-medium text-foreground">{title}</dd>
        </div>
        {author ? (
          <div>
            <dt className="text-muted">{t("recipe.source.author")}</dt>
            <dd>{author}</dd>
          </div>
        ) : null}
        {page ? (
          <div>
            <dt className="text-muted">{t("recipe.source.page")}</dt>
            <dd>{page}</dd>
          </div>
        ) : null}
        {isbn ? (
          <div>
            <dt className="text-muted">{t("recipe.source.isbn")}</dt>
            <dd>{isbn}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
