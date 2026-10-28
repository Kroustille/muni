# Contract: Plant care events UI

**Applies to**: US2 watering, US3 other care (FR-004–FR-007, FR-005).

## Primary actions (plant detail)

| Button (fr.json) | `eventType` | Recap subtitle |
|------------------|-------------|----------------|
| **Arrosé** | `water` | Arrosé |
| **Fertilisé** | `fertilize` | Fertilisé |
| **Rempoté** | `repot` | Rempoté |
| **Taillé** | `prune` | Taillé |
| **Brumisé** | `mist` | Brumisé |
| **Autre soin** | `other` | Autre soin |

Compact **Soin** menu MAY group all non-water types.

## Date picker (all care types)

- Default **today** (user local calendar).
- User MAY pick **past** calendar day only — **not future** (FR-005).
- On save: create `plant_care_event` with chosen `occurredAt`.

## Water-specific rules (US2)

| Rule | UX |
|------|-----|
| Dedupe FR-006 | Second **Arrosé** same plant same calendar day → no-op or toast « Déjà enregistré aujourd’hui » (idempotent) |
| Backdate | Updating **Dernier arrosage** uses **max** `occurredAt` among water events, not tap order |
| History | P1 optional collapsible list of recent water events; full history P2 |

## Other care (US3)

- Multiple types same day allowed (e.g. water + fertilize → two recap lines in 011).
- Optional **notes** per event (max **2000**).

## Reference UX

Mirror recipe **Cuisiné** + backdate from [011 recipe-cooked-dates](../../011-periodic-recap/contracts/recipe-cooked-dates.md) and 012 **Fait** / `practicedAt` patterns.

## Independent test

[quickstart.md](../quickstart.md) § P1 — Watering and other care.

## FR mapping

| FR | Behavior |
|----|----------|
| FR-004 | Arrosé → `water` |
| FR-005 | Backdate |
| FR-006 | Water dedupe |
| FR-007 | Other types |
