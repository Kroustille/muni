# Quickstart: Movie catalog search (003)

**Prerequisites**: Feature **002** complete (X1). Muni running locally.

## Search and add

1. Open movies list → **Rechercher dans le catalogue**.
2. Query `Intouchables` → pick one result → preview → save.
3. Confirm `imdbId` on detail (if present) and catalog rating read-only.

## Dedupe

1. Search same film again → confirm single row updated.

## Soft-delete restore

1. Delete movie; search same `imdbId` → restored.

## Offline

1. Offline: search disabled message; manual add with title only works.
