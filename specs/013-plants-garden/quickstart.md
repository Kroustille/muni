# Quickstart: Plants & garden (013)

**Prerequisites**: Muni **001** on `main`; migration **0017** applied; `yarn db:up` for integration tests.

## Foundation smoke

1. Login → navigate **Plantes** → list + quick-add visible.
2. DevTools → IndexedDB: `plant`, `plant_care_event` stores exist (P2: culture/milestone stores).

## P1 — Add plant (US1)

1. Quick-add **Monstera** → row appears with default **Intérieur**.
2. Offline → open detail → set **Extérieur** → kill app → reopen → tag persists.
3. Soft-delete plant → hidden from list; care events remain in DB but excluded from recap when plant deleted (011 FR-014).

## P1 — Watering (US2)

1. Detail → **Arrosé** (today) → **Dernier arrosage** shows today.
2. Backdate water to **last week** → **Dernier arrosage** still shows **today** if today’s water exists; if only backdated, shows that date.
3. Tap **Arrosé** twice same day → single water event (dedupe).
4. Navigate **Récap** (when 011 implemented) → week shows **Plantes** line **Monstera** / **Arrosé** ([011 T1115](../011-periodic-recap/tasks.md)).

## P1 — Other care (US3)

1. **Fertilisé** with backdated date + note → monthly recap includes line with **Fertilisé** subtitle.
2. Same day **Arrosé** + **Fertilisé** → two recap lines (or two distinct subtitles).

## P1 — Sync

1. Device A offline: plant + two care events → sync online.
2. Device B pull → same rows and `occurred_at` dates.
3. Concurrent LWW: A edits plant notes, B edits title → per-field merge after sync.

## P2 — Seasonal hints (US4)

1. Add hint **Printemps** « Rempotage possible » → displays grouped.
2. **Fait** with date → recap line; hint unchanged (no auto-check guilt).

## P2 — Potager (US5)

1. **Potager** → create **Tomates cerises — bac sud**.
2. Log **Semis** then **Récolte** on different days → yearly recap shows both under **Plantes**.

## P2 — List glance (US6)

1. Two plants; water one → list shows different **Dernier arrosage**; other shows « — ».
2. Confirm no red overdue badges.

## Recap / heatmap cross-check (011)

1. Seed care events on two days → heatmap cell shows **`plants`** segment (green `#16a34a`) when 011 US7 shipped.
2. Contributor order: **Plantes** after **Entraînement** in list sections.

## Quality gate

- `yarn typecheck`
- `tests/unit/plants-garden/*`, `tests/integration/plants-garden-sync.test.ts`
- `tests/unit/recap/plants-contributor.test.ts` (with 011)
- `tests/e2e/plants-garden.spec.ts`
- `yarn verify:ci` before push to `main`
