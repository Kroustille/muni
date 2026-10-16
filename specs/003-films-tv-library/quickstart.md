# Quickstart: Films & TV library (003)

**Prerequisites**: Feature **002** complete (X1). Muni running locally.

## Phase A — Search and add

1. Open movies list → **Rechercher dans le catalogue**.
2. Query `Intouchables` → pick one result → preview → save.
3. Confirm `imdbId` on detail (if present) and catalog rating read-only.

### Dedupe

1. Search same film again → confirm single row updated.

### Soft-delete restore

1. Delete movie; search same `imdbId` → restored.

### Offline

1. Offline: search disabled message; manual add with title only works.

## Phase B — Library richness

1. Open a film detail → add **tags** and **saga** + **ordre**.
2. Set status **En pause** or **Vu**; on **Vu**, confirm **date de visionnage** defaults to today (editable).
3. For a **série** (`mediaKind` series): status **En cours** is available; films must not offer **En cours**.
4. On série detail, use **Épisodes** grid to mark **épisode vu**; confirm **prochain épisode** banner updates.
5. Optional: enable **rappel** with a diffusion date (local browser notification).
6. Add a **citation** on detail; works offline; syncs when signed in.

## Phase C — Discovery

1. On `/movies`, open discovery filters → filter by tag, mood, film vs série.
2. On detail, **Où regarder** shows empty state until a streaming provider is configured server-side.

## Phase D — Insights

1. Open `/movies/insights` → annual progress, streak, heatmap, stats.
2. Watch goals are stored locally (IndexedDB); server `watch_goals` table exists for future sync — no dedicated push/pull routes yet (same as reading goals).
