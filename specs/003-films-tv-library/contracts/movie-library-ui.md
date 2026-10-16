# Contract: Movie / TV library UI (Phase B)

## Film vs série

- **Films**: status **À voir**, **Vu**, **En pause** only — never **En cours**.
- **Séries**: **À voir**, **En cours**, **En pause**, **Vu** (when complete or user marks série vue).

## Tags & franchise

- **Tags**: chip input; filter from list.
- **Franchise / saga**: fields **Saga** (name) + optional **Ordre** within saga; list may group by saga.

## Watch date

- On **Vu**, default **Date de visionnage** to today; editable; may be cleared.

## Episodes (séries only)

- Section **Épisodes**: grid or list by season; toggle **Épisode vu** per row.
- **Prochain épisode** banner on detail and optional list badge.
- **Rappels**: opt-in notification when next episode air date known (permission).

## Notes & quotes

- **Notes privées**: multiline `notes`.
- **Citations**: child records; add/edit/delete per `movie-quotes-sync.md`.

## FR mapping

| UI | Requirements |
|----|----------------|
| Tags, franchise | FR-B01, FR-B02 |
| Status + watch date | FR-B03–B05 |
| Episodes, next, reminders | FR-B08, FR-B09 |
| Notes, quotes | FR-B06, FR-B07 |
