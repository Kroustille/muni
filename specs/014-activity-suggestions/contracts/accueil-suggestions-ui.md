# Contract: Accueil suggestions UI

**Applies to**: `src/components/home/activity-suggestions-card.tsx`, `src/app/(app)/page.tsx`

## Placement

- **Route**: `/` (Accueil) — [011 bottom-nav](../../011-periodic-recap/contracts/bottom-nav.md) Home
- **Position**: Below existing home lists/teasers; **not** replacing quick-add or list previews
- **Anchor**: Wrapper `id="activity-suggestions"` for Récap deep link (OD-014-4)

## Layout (informational)

```
┌─────────────────────────────────────┐
│ {suggestions.title}                 │
│ {suggestions.subtitle}        [×]   │  ← block dismiss (optional P1)
├─────────────────────────────────────┤
│ · {row.title} ({domain label})      │
│   [{primaryAction}] [Pas maintenant]│
│ · … second row …                    │
└─────────────────────────────────────┘
```

## States

| State | UI |
|-------|-----|
| 2 slots | Two rows + intro |
| 1 slot | One row + `suggestions.partialEmpty` neutral copy |
| 0 candidates | **Hidden** or `suggestions.neutralEmpty` (spec US1) |
| Block dismissed today | Hidden |
| Offline | Same as online (local data) |

## Copy rules (FR-005, SC-003)

- Intro: invitational (“Deux idées pour plus tard”, “Sans obligation — tu choisis.”)
- **Forbidden** in `suggestions.*` strings: guilt lexicon from 009 review (“en retard”, “tu n’as rien fait”, “chaîne brisée”, raw “X jours” counters)
- Domain labels via i18n: `suggestions.domain.book`, etc.

## Actions

| Control | Behavior |
|---------|----------|
| Primary | Navigate `deepLink` ([suggestion-deep-links.md](suggestion-deep-links.md)) |
| Pas maintenant | `dismissSlot` — row removed, no backfill |
| × (header) | `dismissBlock` for calendar day |

## Accessibility

- Section `aria-labelledby` on title
- Dismiss buttons have accessible names (not icon-only without label)

## Loading

Skeleton **not** required — compute synchronously from local stores; if >16ms, optional lightweight placeholder (plan: skip unless perf test fails).
