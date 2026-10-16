# Contract: Book discovery UI (Phase C)

## Mood & pace

- On book detail (and optional post-read prompt): dropdowns **Ambiance** (`mood`) and **Rythme** (`pace`) with values from research.md §16 (French labels in i18n).
- Clearing selection sets field null.

## Filters (books list)

- Filter sheet: **Ambiance**, **Rythme**, **Tags** (multi-select), existing status filters.
- Combining dimensions: status AND (mood if set) AND (pace if set) AND (any selected tag).
- Empty filter set = no extra constraint.

## Private recommendations

- Section **Pour vous** on books tab (below list or dedicated subview): up to 5 titles from `BookRecommender` port (research.md §15).
- Only books in user library; no external titles.
- Hide when fewer than 3 suggestions.
- Tap opens book detail or quick-add if somehow missing (should not happen).

## Offline

- Filters and recs use local store only; no network required.

## FR mapping

| UI area | Requirements |
|---------|----------------|
| Mood & pace editors | FR-C01 |
| Discovery filters | FR-C02 |
| Pour vous recommendations | FR-C03 |
