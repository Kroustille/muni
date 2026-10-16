# Contract: Book insights UI (Phase D)

## Reading goal

- Screen or sheet **Objectif de lecture** : year (default current), target **Nombre de livres** (integer ≥ 1).
- Progress ring or fraction: `finishedInYear / target` per data-model finish rules.
- Private — no sharing UI.

## Activity heatmap

- **Activité de lecture** : 12-month (or year-to-date) calendar grid; day cell highlighted if activity day (research.md §13).
- Tooltip: date + optional “activité enregistrée” (no per-book breakdown required v1).

## Streak

- Optional line **Série actuelle : N jours** when N > 0; copy avoids guilt (“optionnel” in settings to hide).

## Stats breakdowns

- Tabs or sections: **Par mois** (books finished), **Genres**, **Tags**, **Auteurs**, **Pages lues** (sum `pagesRead` or `pageCount` for `read` in period).
- Charts simple (bars/tables); no export v1.

## Year in review

- Available in December or via **Bilan {year}** for completed calendar years.
- Summary cards: books read, pages, top tags/genres, longest streak in year.
- All derived client-side from items + goals.

## Settings

- Toggle show/hide streak and heatmap on books tab.
- Timezone for activity days: default Europe/Paris until user preference exists (OD-002-9).

## FR mapping

| UI area | Requirements |
|---------|----------------|
| Objectif de lecture | FR-D01 |
| Heatmap, streak | FR-D02 |
| Stats breakdowns | FR-D03 |
| Bilan / year in review | FR-D04 |
