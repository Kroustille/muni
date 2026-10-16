# Contract: Movie discovery UI (Phase C)

## Mood & pace

- Pickers on movie detail (same vocab as books).
- Optional; clearable.

## Filters

- Movies list sheet: filter by **tags**, **mood**, **pace**, **Film / Série**.
- Combine with existing title search.

## Where to watch

- Section **Où regarder** on detail when `streamingProviders` non-empty.
- Loading + empty states when offline or provider returns nothing (FR-C04).

## Recommendations

- Panel **Pour vous** on movies list: unread/to_watch titles scored locally (FR-C03).
- No network calls.

## FR mapping

| UI | FR-C01–C04 |
