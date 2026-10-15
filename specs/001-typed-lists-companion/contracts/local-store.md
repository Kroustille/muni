# Contract: Local store (`ItemRepository` port, IndexedDB adapter)

Two layers, both local and never awaiting the network:

- **`ItemRepository` port** (`src/application/ports/item-repository.ts`, implemented by the IndexedDB adapter in `src/adapters/indexeddb/`): plain persistence with no business rules.
- **`items` use cases** (`src/application/items.ts`): the operations below, holding all create/update logic (validation, id and timestamp generation, HLC stamping, outbox). The UI reaches data only through these use cases.

## `ItemRepository` port (persistence only)
- `get(id)`, `put(item, { enqueue })`: store an item; when `enqueue` is true, write the outbox entry in the same atomic transaction.
- `query({ type?, status?, includeDeleted? })`: items matching the filters, newest first by `created_at`.
- `outbox()` / `clearOutbox(ids)`: read and remove pending outbox entries.
- `meta.get(key)` / `meta.set(key, value)`: `deviceId`, `hlcState`, `userId`, `pullCursor`.
- `subscribe(listener)`: notified after every committed write so views refresh.

## `items` use cases (business logic)
- `createItem(type, title, extra?) -> Item`: validates non-empty title, generates id and `created_at`, stamps `fields_updated_at`, saves with outbox entry, notifies the sync scheduler.
- `updateItem(id, patch)`: stamps only changed fields with a new HLC; adds to outbox.
- `deleteItem(id)` / `restoreItem(id)`: set or clear `deleted_at` as a stamped field (supports Undo).
- `listItems(type, { status? })`: non-deleted items, newest first.
- `getItem(id)`
- `counts()`: per-type count of non-deleted items.
- `recent(limit)`: most recently created non-deleted items across types.
- `search(query)`: case- and accent-insensitive substring match on title/name only across all types (other fields may be added later); empty result is a normal outcome. Implemented by the search use case over the repository.
- `recommenders(prefix)`: distinct suggestions from past entries.
- `subscribe(listener)`: change notifications, delegating to the repository.
- `applyRemote(rows)`: merge per field with the domain `merge` (used only by sync).
