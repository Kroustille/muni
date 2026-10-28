# Research: Muni v1

All Technical Context items are resolved; no NEEDS CLARIFICATION remain.

## 1. Local store access
- **Decision**: IndexedDB through `idb`, one object store per entity with indexes on `type`, `updatedAt`, `deletedAt`.
- **Rationale**: Constitution mandates IndexedDB; `idb` is a thin promise wrapper with no abstractions to fight.
- **Alternatives**: Dexie (heavier, own sync add-ons we do not want); RxDB (replication framework conflicts with Simplicity); SQLite WASM (overkill at a few thousand items).

## 2. Sync model
- **Decision**: Each item row stores `fields_updated_at` (map field name to HLC timestamp). Client keeps a local outbox of changed items. Push sends changed rows; the backend `sync-service` applies per-field LWW with the domain merge and returns the merged row. Pull fetches rows with `server_updated_at > cursor`. Soft delete via `deleted_at` treated as a field under the same LWW rule (so edit vs delete: latest wins, matching the spec edge case).
- **Rationale**: Meets FR-015 to FR-017 with the smallest mechanism; matches Principle IV.
- **Timestamps**: Hybrid logical clock (wall time plus counter plus device id tie-break) to tolerate device clock skew and guarantee deterministic convergence (SC-004).
- **Alternatives**: Row-level LWW (loses concurrent edits to different fields); CRDTs/Yjs (forbidden); server push/WebSocket live sync (out of scope, extra infrastructure).

## 3. Merge location
- **Decision**: The merge runs in backend TypeScript, in the `sync-service` use case, using the same domain `merge` and `clock` code as the client. The PostgreSQL adapter provides a transaction that locks the affected rows (`SELECT ... FOR UPDATE` by `(user_id, id)`), the use case merges, and the adapter writes the result and sets `server_updated_at`. SQL holds only storage and CHECK constraints, no merge logic.
- **Rationale**: One implementation of the merge for client and server, tested once with shared vectors; business logic stays out of SQL and the database stays replaceable. Row locks inside a transaction avoid read-modify-write races.
- **Alternatives**: A PL/pgSQL `sync_push` function (duplicates the merge in a second language, hides business rules in the database); client-side merge with conditional upserts (race-prone).

## 4. Sync triggers
- **Decision**: Run on app open, on `online` event, on visibility change to visible, and every 60 s while online; debounce after local writes (~2 s). Background Sync API is not relied on (unsupported on iOS).
- **Rationale**: Satisfies the 10 s reconnect target and spec assumption (no live push).

## 5. Auth
- **Decision**: Self-hosted auth in the backend. Google via `openid-client` inside the `OAuthProvider` adapter (OIDC authorization code with PKCE, state and nonce; id-token verification of issuer, audience, expiry, nonce and signature; verified email required); OAuth state, nonce and verifier carried in a short-lived HttpOnly cookie. Magic link handled in-house: random single-use token, stored hashed with a short expiry (for example 15 minutes), sent by email over SMTP, consumed atomically by the `verifyMagicLink` use case. Sessions: opaque random token in an HttpOnly, Secure, SameSite=Lax cookie, stored hashed in PostgreSQL with a sliding expiry. The first successful sign-in creates the user; Google and magic link accounts with the same verified email map to the same user. Requesting a magic link returns the same response whether or not the email is known. Sign-out is a same-origin POST that deletes the session. On the client, sync pauses when the API answers 401 and the UI prompts re-authentication without blocking local data. First use requires account sign-in with a connection; afterwards fully offline, and an expired session never blocks local data (clarification).
- **Rationale**: One small OIDC library does the security-sensitive part (PKCE, nonce, id-token verification) without coupling to a web framework; everything else is a few use cases behind ports.
- **Alternatives**: Passport (Express-oriented, needed a request bridge; dropped by the user); `arctic` and Auth.js or Better Auth (own user and session models, fit ports poorly); passwords (forbidden).

## 6. Search
- **Decision**: In-memory normalized index built from IndexedDB on app start and updated on writes: lowercase plus NFD accent stripping, substring match on title/name only (clarification: starting point; other fields may be indexed later).
- **Rationale**: 5,000 items scan linearly in a few milliseconds; no search library needed. Meets SC-006 offline.
- **Alternatives**: MiniSearch/FlexSearch (unneeded dependency); Postgres full-text (online only).

## 7. PWA and offline shell
- **Decision**: Serwist precaches the app shell and static assets; Next.js routes are client-rendered from IndexedDB; web manifest with icons, `display: standalone`.
- **Rationale**: Gives installability (SC-007) and fast offline loads (SC-008). Serwist is the maintained successor of next-pwa.
- **Alternatives**: Hand-written service worker (more error-prone); next-pwa (unmaintained).

## 8. Styling, theme, i18n
- **Decision**: Tailwind with `prefers-color-scheme` dark variant (system only, no toggle); small in-house `t(key)` over `fr.json` with typed keys; no ICU library at v1.
- **Alternatives**: next-intl (routing features unneeded for one language); component libraries (forbidden).

## 9. Item schema shape
- **Decision**: One `items` table with `type` plus typed nullable columns (author, status, recommended_by, rating, notes, quantity, checked) and JSON columns `ingredients` and `steps` (each a single LWW field per clarification).
- **Alternatives**: Table per type (4x migrations and sync code, little benefit); fully generic JSONB (violates Typed Lists principle).

## 10. Recommender suggestions
- **Decision**: Derived at query time from distinct `recommended_by` values in local items; no separate table.
- **Rationale**: Simplicity; the "Recommender name" entity is a view, not stored data.

## 11. Testing
- **Decision**: TDD. Vitest for domain, merge, use cases and sync (with `fake-indexeddb` and in-memory ports); PostgreSQL integration tests against a Docker Compose test database with a fresh schema per test file, created by running the Kysely migrations (so migrations are tested too), including a two-user isolation test (required by constitution); route handler tests for authentication and authorization; Google OIDC adapter tests with mocked HTTP and JWKS; Mailpit to read magic links in e2e; Playwright for auth, offline, two-context sync and install checks. Coverage threshold 80% on the logic folders; an architecture test enforces the hexagonal dependency rule.

## 12. Backend placement
- **Decision**: Next.js route handlers (Node runtime) in the same project, as thin driving adapters over server use cases.
- **Rationale**: Reuses domain code directly, one deployable and one image, no inter-service contract; hexagonal layering allows extracting a Node service later.
- **Alternatives**: Separate Node service (second deployable for no current benefit); server actions (poor fit for the sync client).

## 13. Data access and migrations
- **Decision**: Kysely (typed query builder) over the `pg` driver in repository adapters. Table types are generated by `kysely-codegen` from the migrated database into the committed `src/adapters/postgres/db-types.ts`; CI regenerates and fails on a diff. Migrations use Kysely's built-in `Migrator` with TypeScript migration files in `db/migrations/`, registered in a static provider, compiled to JavaScript and run with `node dist/db/migrate.js up|down` (`migrate:up`, `migrate:down` scripts). Transactions and row locks use `transaction()` and `forUpdate()`.
- **Rationale**: Typed SQL without an ORM mapping layer that would blur the domain model; one tool for queries and migrations; generated types cannot drift from the schema; compiled migrations run from the app image with no extra tooling. Kysely lives only in the PostgreSQL adapter, so the domain and use cases do not depend on it.
- **Alternatives**: hand-written table types (can drift); types generated only in CI (local typecheck needs a database); `tsx` in a separate migrate image (rejected by the user); `node-pg-migrate`, dbmate, Flyway; ORMs (Drizzle, Prisma).

## 14. Hosting and deployment
- **Decision**: Docker Compose on a self-hosted VPS (assumption, not final): a multi-stage `Dockerfile` for the Next.js app (standalone output, non-root), PostgreSQL with a persistent volume, and a one-shot migration job before the app starts; configuration through environment variables validated at startup. Development compose adds Mailpit as the SMTP catcher.
- **Not decided**: TLS reverse proxy, backups, SMTP provider.

## 15. Nested HTML forms (2026-10-28)

- **Decision**: **No** `form` descendants of another `form` in the live DOM. Catalog and quick-add flows MUST follow [contracts/nested-forms-ui.md](contracts/nested-forms-ui.md).
- **Rationale**: HTML invalidity; broken submit on book/movie quick-add when catalog sheets open inside quick-add wrapper form.
- **Alternatives**: Ignore (rejected — reproducible bug); only fix preview (insufficient — search sheet also nested).
