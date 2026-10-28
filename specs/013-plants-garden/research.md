# Research: Plants & garden companion (013)

**Date**: 2026-10-28

**Purpose**: Justify a dedicated **013** domain; define **recap-eligible events** for **011**; compare patterns to **012** practice logs and **011** recipe **`cookedDates`**.

## Why a new feature (not shopping or recipes)

| Dimension | Shopping (001) | Recipes (001/010) | **013 Plants** |
|-----------|----------------|-------------------|----------------|
| **User job** | Buy items | Cook from recipe | **Care for living plants** over seasons |
| **Completion signal** | Check-off | **`cookedDates`** | **`plant_care_event.occurredAt`**, **vegetable milestones** |
| **Time dimension** | One-off | Cook again anytime | **Watering rhythm**, **seasonal tasks**, **grow cycle** |
| **Recap** | Excluded (011 FR-007) | **Recettes** section | **Plantes** section (new) |

**Conclusion**: Plants need **event log + optional seasonal guide + potager milestones** — closest Muni patterns are **012 `practice_log`** (explicit date, backdate, recap-friendly) and **011 recipe cooks** (dedupe per day).

## Indoor vs outdoor

| Approach | Choice |
|----------|--------|
| Separate list types | Rejected — same mental “my plants” |
| **Location tag** on one **Plant** entity | **Selected** — `indoor` / `outdoor` / `both`; filters in P2 |
| Separate apps/routes | Rejected |

**Vegetable cultures** are **optional second entity** because milestones (**semis → récolte**) differ from houseplant **water** UX, while still rolling up to recap domain **`plants`** (French **Plantes**).

## Seasonal care (MVP shape)

| Idea | MVP |
|------|-----|
| Push “water now” | **Rejected** — guilt-adjacent; notifications out of 011 scope too |
| **User-authored seasonal hints** | **P2** — text by season/month; optional **Fait** → care event |
| **Care profile templates** | **P2** — copy hints onto new plants |
| Shipped species database | **Rejected** — no ID API; user names plants |

Normative seasons for UI grouping (Northern Hemisphere default, France):

| Key | French label |
|-----|----------------|
| `winter` | Hiver |
| `spring` | Printemps |
| `summer` | Été |
| `autumn` | Automne |

Month ranges MAY be free text (“Mars–avril”) on hints when precision needed.

## Watering log

| Rule | Detail |
|------|--------|
| Storage | Append **`plant_care_event`** rows, not only `lastWateredAt` field |
| **Dernier arrosage** | Derived `max(occurredAt)` where `eventType = water` |
| Dedupe | One **`water`** per plant per calendar day (011 recipe cook parity) |
| Backdate | Allowed; last-watered uses **calendar max**, not insert order |
| History | P1 detail list optional P2; recap uses events directly |

## Vegetable milestones (potager MVP)

| Milestone | `milestoneType` | French recap subtitle |
|-----------|-----------------|------------------------|
| Sowing | `sow` | Semis |
| Transplant | `transplant` | Repiquage |
| Thinning | `thin` | Éclaircissage |
| Harvest | `harvest` | Récolte |

**Calendar/tasks MVP proposal**: No automatic “tasks due today” engine in v1 — user **logs milestone when done** (like **Cuisiné**). **P2+** MAY show a **checklist** of typical milestones empty until user sets dates (planning). Spec P2 accepts simple **milestone buttons** on culture detail.

## Recap signals (normative for 011 contributor)

Domain id: **`plants`**. French section: **Plantes**. Stable order: **after `fitness`**, before any future domains (see 011 OD-011-5 update).

| Event source | Include in period when | `RecapAchievement.title` | `subtitle` |
|--------------|------------------------|--------------------------|------------|
| `PlantCareEvent` | `occurredAt` in period | Plant `title` | French care label |
| `VegetableMilestone` | `occurredAt` in period | Culture `title` | French milestone label |

**Exclude**: deleted plant/culture; events without valid date; inferred watering from notes edits.

**Heatmap**: Each calendar day with ≥1 eligible plant event adds **`plants`** to `domainsPresent` (011).

**Event type enum (for contracts / tests)**:

```text
PlantRecapEventKind:
  plant_care_water
  plant_care_fertilize
  plant_care_repot
  plant_care_prune
  plant_care_mist
  plant_care_other
  vegetable_milestone_sow
  vegetable_milestone_transplant
  vegetable_milestone_thin
  vegetable_milestone_harvest
```

Implementation MAY collapse to **`PlantCareEventType`** + **`VegetableMilestoneType`** without separate recap table.

## Alignment with [009](../009-experiences-achievements/spec.md)

| Principle | 013 application |
|-----------|-----------------|
| Subjective novelty | Caring for **my** monstera or **my** tomates — personal, not benchmarked |
| Companion, not coach | No overdue watering; seasonal hints optional |
| Domains authoritative | Plants own events; 011 only aggregates |
| Capture speed | Name-only plant create |

## Alignment with [012](../012-music-practice/spec.md) practice log

| 012 | 013 |
|-----|-----|
| `practice_log.practicedAt` | `plant_care_event.occurredAt` |
| Mark exercise **Fait** | **Arrosé** / **Fertilisé** |
| Future 011 contributor | **Ships with 013** in 011 spec update |

## Explicitly rejected for v1

| Idea | Reason |
|------|--------|
| Pl@ntNet / PictureThis API | User constraint; privacy; offline |
| Auto watering schedule enforcement | Coach/guilt risk |
| Merge into fitness or shopping | Wrong typed list semantics |
| Recap-only shadow log | 011 reads domain events only (FR-012) |

## Open questions (product — max 4 for handoff)

See spec completion report; defaults documented in spec Assumptions where not blocking.
