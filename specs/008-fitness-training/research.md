# Research: Fitness — training plan, logging, progression (008)

## 1. Storage model (user data vs catalog)

- **Decision**: User-owned fitness entities live in **dedicated Postgres tables** with matching **IndexedDB** stores and **dedicated sync push/pull routes** (same LWW + `fields_updated_at` + soft-delete pattern as `book_quotes` / `movie_quotes`), not as new `items` row types.
- **Rationale**: Programs, logs, and nested sets are not “title + a few columns” lists; stuffing them into `items` would fight type-field checks and bloat sync payloads. Quotes precedent keeps item sync stable.
- **Alternatives**: Single `fitness_program` jsonb blob per user (rejected — hard to merge per-field and to query progression); CRDT/event log (rejected — constitution IV).

## 2. Nested log structure (sets on a workout)

- **Decision**: `fitness_workout_logs.logged_exercises` is one **jsonb array** field with per-field LWW (like recipe `ingredients` / `steps`). Each element: `exerciseId`, `nameFrSnapshot`, optional `order`, `sets[]` with optional `reps`, `chargeKg`, `durationSeconds`, `distanceNote`, `rpe`.
- **Rationale**: FR-024–FR-025; whole-array LWW matches existing merge semantics; acceptable at Muni scale (few dozen sets per workout).
- **Alternatives**: Normalized `fitness_sets` table (deferred — more migrations/sync surface for MVP).

## 3. Exercise catalog delivery

- **Decision**: Canonical seed files in `specs/008-fitness-training/` (`exercises.catalog.json`, `muscles.catalog.json`). Build copies JSON into `public/fitness/` (or equivalent static import). On app boot / version bump, client **upserts** catalog into IndexedDB store `fitness_exercise_catalog` keyed by `id`; **no user sync** and **no runtime network fetch** (FR-027).
- **Rationale**: Offline gym use; versioned bumps ship with releases; logs keep `exerciseId` + `nameFrSnapshot`.
- **Alternatives**: Postgres global catalog table synced to clients (rejected for MVP — unnecessary server dependency).

## 4. Charge and duration units

- **Decision**: Store **charge in kilograms** internally (`chargeKg`); user preference `kg` | `lb` in `fitness_user_settings` for display/input conversion. Store **duration in seconds** (`durationSeconds`); UI may show minutes when ≥ 60s.
- **Rationale**: Spec assumptions; single canonical unit avoids per-exercise mixing (out of scope).
- **Alternatives**: Store display unit per set (rejected).

## 5. Calendar date vs instant

- **Decision**: Each workout log and skip record stores `calendarDate` (`YYYY-MM-DD` in user’s local timezone at save) plus `startedAt` / `completedAt` UTC instants for ordering and sync.
- **Rationale**: Spec edge case (travel/timezone); week adherence uses Monday-start week in `Europe/Paris`-style local calendar (French locale default).
- **Alternatives**: UTC-only dates (rejected — breaks “today” UX).

## 6. One in-progress workout

- **Decision**: At most **one** `fitness_workout_log` with `status = in_progress` per user; starting another prompts to finish or abandon the existing log (FR edge).
- **Rationale**: Avoids ambiguous “today” state; enforce in application use case.
- **Alternatives**: Multiple concurrent logs (rejected).

## 7. Personal records (PR)

- **Decision**: **Derived on read** (and optionally memoized in client memory after save) from historical logs: max `chargeKg` per `exerciseId`, max reps at a given charge bucket; surface informational badge on save (FR-032). No persisted PR table in MVP.
- **Rationale**: PRs are not user-edited; recompute keeps sync simple.
- **Alternatives**: `fitness_personal_records` table (deferred).

## 8. Phase D companion scope

- **Decision**: Implement **recovery check-in** fields on `fitness_workout_logs` (optional jsonb `recovery`) and **settings** flags for streak/home card only in Phase D tasks; schema may include nullable columns in Phase C migration to avoid a second migration, but UI ships in D.
- **Rationale**: Spec phases A–C = MVP product; D after end-to-end training loop.
- **Alternatives**: Ship home card in A (rejected — spec defers unless trivial).

## 9. Health / Garmin

- **Decision**: **No** HealthKit, Google Fit, Garmin Connect, or wearable import in Phases A–C or D unless replanned.
- **Rationale**: Locked in spec.
- **Alternatives**: N/A.

## 10. Catalog validation in CI

- **Decision**: `node specs/008-fitness-training/validate-catalog.mjs` in quality gate (add to `package.json` script or existing verify step when implementing).
- **Rationale**: Keeps category enums and equipment closed sets consistent across seed files.
- **Alternatives**: N/A.

## 11. Session-first migration (weekly program UI → séance library)

**Context (2026-10-28)**: Product direction changed after an initial implementation batch shipped **weekly program** UX on `main`: roughly **`fitness_program`** with jsonb **`plannedSessions`**, each session carrying **`weekdays[]`**, plus fitness home “today’s planned session” driven by weekday matching. The **target spec** ([spec.md](./spec.md) § Clarifications 2026-10-28) replaces that with:

1. **`fitness_seance_template`** (library) — title + ordered catalog exercises, **no weekdays**.
2. **`fitness_scheduled_seance`** — optional **planifier**: one template on one **explicit `calendarDate`**.
3. **Do now** — start any template without schedule; **Séance libre** unchanged.
4. **Reject** — one “active program” with recurring weekday slots as primary UX.

**Migration intent (for a future implement task — not this spec commit)**:

| Area | Intent |
|------|--------|
| **Data** | Split or migrate each legacy **planned session** into a **séance template** (drop `weekdays` on the template). For each weekday assignment, either (**A**) create **scheduled séances** on upcoming explicit dates only (lossy for “every Monday” unless user re-planifies), or (**B**) one-time conversion script that expands next N weeks into dated rows, or (**C**) keep legacy rows read-only and prompt user to rebuild library — **choose in tasks** with Valentin. |
| **`FitnessProgram` / `isActive`** | Deprecate program container; library has many templates, zero or one “active program” flag is **not** required. |
| **Workout logs** | Rename link field `plannedSessionId` → `seanceTemplateId`; set `scheduledSeanceId` when applicable. Historical logs remain valid with snapshot data. |
| **Skip records** | Point at `scheduledSeanceId` (and template id for display). |
| **UI** | Replace program editor + weekday picker with **Mes séances** library + **Planifier** date picker; fitness home prioritizes **planifiée** for today + **Démarrer** list. |
| **Contracts** | Update [program-editor.md](./contracts/program-editor.md) → séance library contract; sync payload shapes in [fitness-sync-api.md](./contracts/fitness-sync-api.md). |
| **Tasks** | Regenerate or append migration tasks in [tasks.md](./tasks.md); e2e flows in [quickstart.md](./quickstart.md). |

**Open questions for implement planning**:

- Whether to auto-migrate existing user program data on upgrade or show empty library + import offer.
- Whether `fitness_program` table is dropped in a later migration or kept as a compatibility view.
- How week adherence (US6) treats legacy weekday-only data before migration completes.
