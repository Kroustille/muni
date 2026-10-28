# Contract: Vegetable culture UI (P2)

**Applies to**: US5 potager milestones (FR-010).

## List (`/plants/potager`)

| Control | Behavior |
|---------|----------|
| Quick-add | **Titre** only → `vegetable_culture` |
| Row | Title + optional `locationNote` subtitle |

## Detail (`/plants/potager/[id]`)

| Field | Editable |
|-------|----------|
| Title | **1–500** |
| Emplacement / bac | `locationNote` max **300** |
| Variété | `variety` max **200** |
| Notes | max **5000** |

## Milestone buttons

| Button (French) | `milestoneType` | Dedupe |
|-----------------|-----------------|--------|
| **Semis** | `sow` | One per culture per calendar day |
| **Repiquage** | `transplant` | same |
| **Éclaircissage** | `thin` | same |
| **Récolte** | `harvest` | same |

Each tap opens date picker (default today; past only) → append `vegetable_milestone`.

Recap subtitle = milestone French label ([research.md](../research.md) table).

## Independent test

[quickstart.md](../quickstart.md) § P2 — Potager.

## FR mapping

| FR | UI |
|----|-----|
| FR-010 | Milestone types + dates |
