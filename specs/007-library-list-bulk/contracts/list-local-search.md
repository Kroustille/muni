# Contract: List-local search UI

**Applies to**: `ListPageContent` routes (shopping, books, movies, recipes) and `MusicListPage` (artists, tracks).

## Controls

- Text input with French label/placeholder (i18n keys under `list.search.*`).
- Debounce optional (≤300ms); instant filter acceptable for V1.

## Behavior

- Filter **client-side** on items already loaded for the list type (FR-002).
- Empty query → no search filter applied (show current status/tag filters only).
- No matches → use `ListEmptyState` or dedicated empty-search copy (French).

## Match matrix

| List type | Match if normalized query substring of |
|-----------|----------------------------------------|
| book | `title`, `author` |
| movie | `title`, `director` |
| music_track | `title`, `artist` |
| music_artist | `title` |
| shopping, recipe | `title` |

Normalization: `normalizeText` from `src/domain/text.ts`.

## Non-goals

- Tags, franchise name, notes (V1).
- Server/network search.
