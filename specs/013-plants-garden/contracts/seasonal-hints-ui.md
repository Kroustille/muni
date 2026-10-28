# Contract: Seasonal hints UI (P2)

**Applies to**: US4 seasonal care guide (FR-009).

## Placement

Plant detail section **Soins saisonniers** below care action buttons.

## Hint editor

| Field | UI | Rules |
|-------|-----|-------|
| Season | Optional select | Hiver / Printemps / Été / Automne → `seasonKey` |
| Période | Optional text | « Mars–avril » → `monthRangeText` max **100** |
| Action | Required text | `actionText` **1–500** |

Grouped display by `seasonKey` French label; hints with only `monthRangeText` under **Autre période**.

## Mark done (**Fait**)

| Step | Behavior |
|------|----------|
| Tap **Fait** | Date picker default today; backdate past only |
| Save | Creates `plant_care_event` with `seasonalHintId` = hint id; `eventType` **`other`** unless product maps keyword → type (default **`other`**) |
| Recap | Line under **Plantes** with plant title + care label |

Ignoring hints creates **no** events and **no** nag copy.

## Care profiles (P2)

- List/create profiles under settings or plant detail **Appliquer un profil**
- Copy `seasonalHints` from profile onto plant (new hint ids client-side)

## Independent test

[quickstart.md](../quickstart.md) § P2 — Seasonal hints.

## FR mapping

| FR | UI |
|----|-----|
| FR-009 | Hints + Fait |
| FR-013 | Optional empty CTA only |
