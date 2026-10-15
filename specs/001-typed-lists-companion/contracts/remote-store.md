# Contract: RemoteStore (sync port and HTTP API)

Two sides of one contract:

- **Client port** `RemoteStore` in `src/application/ports/remote-store.ts`, implemented by the HTTP adapter in `src/adapters/http/` (fetch to the endpoints below). The client sync engine depends only on this port.
- **Server use case** `sync-service` in `src/application/server/sync-service.ts`, exposed by the route handlers `src/app/api/sync/push` and `pull`. It depends on the `ServerItemRepository` port (PostgreSQL adapter in `src/adapters/postgres/`) and merges with the domain `merge`.

All endpoints require a valid session cookie. The user id is taken from the session only.

## `push(items: ItemWire[]) -> ItemWire[]`  (`POST /api/sync/push`, body `{ items }`, response `{ items }`)
- Input: changed items with all fields and `fields_updated_at`. `ItemWire` has no `user_id`; a payload containing one is a `validation` error.
- Behavior (in one transaction, rows locked by `(user_id, id)`): validate each row with the domain schema; if the row is absent for this user insert it; otherwise merge per field by greater HLC with device-id tie-break. Sets `server_updated_at` when anything changed. Never touches another user's rows.
- Output: merged rows, which the client stores locally.
- Errors: `unauthenticated` (HTTP 401: pause sync, prompt re-auth), `validation` (HTTP 422 with per-row errors: row quarantined and reported), network failure (retry with backoff, outbox kept). State-changing requests also require a same-origin check.

## `pull(since: string | null, limit: number) -> { items: ItemWire[], cursor: string }`  (`GET /api/sync/pull?since=&limit=`)
- Returns the caller's rows with `server_updated_at > since`, ordered ascending, including soft-deleted rows. Client repeats until fewer than `limit` rows return.
- Client merges each row per field and clears outbox entries only if the merged result equals what was pushed.

## `ItemWire`
JSON form of the Item in [data-model.md](../data-model.md) using snake_case names, without `user_id`.

## Guarantees
- Idempotent: pushing the same item twice has no further effect.
- Convergent: two devices applying the same set of rows in any order reach the same state.
- Isolation: a caller can never read or write another user's rows, including by reusing an item id. Tested at use-case level (in-memory), PostgreSQL adapter level and route handler level with two users.
