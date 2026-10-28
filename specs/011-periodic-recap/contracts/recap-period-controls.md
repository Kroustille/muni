# Contract: Récap period controls (011)

**Applies to**: `src/components/recap/recap-period-controls.tsx`, French i18n, `/recap` page shell.

**Replaces**: Row of four+ **toggle buttons** for granularity (implementation debt — spec update 2026-10-28).

## Granularity control (FR-004)

Use a single native **`<select>`** (styled per 005 — ink+teal, min tap height 44px) for the active **period type**. Options and French labels:

| `RecapPeriodGranularity` | `<option>` label (i18n key) |
|--------------------------|-----------------------------|
| `day` | **Jour** (`recap.period.granularity.day`) |
| `week` | **Semaine** (`recap.period.granularity.week`) |
| `month` | **Mois** (`recap.period.granularity.month`) |
| `year` | **Année** (`recap.period.granularity.year`) |

**Rejected for MVP**: Horizontal row of equal-width period **buttons** (crowded on mobile, poor scan). **Segmented control** rejected unless 005 adds a shared component — `<select>` matches existing form controls and a11y.

### Desktop

Same `<select>`; MAY use compact width (`max-w-xs`) beside the period range label. No separate desktop-only button row.

### Day shortcuts (optional, same row as select)

When granularity is **`day`**, MAY show two secondary **buttons** (not duplicate select options):

- **Aujourd’hui** — sets anchor to local today (`recap.period.dayToday`)
- **Hier** — sets anchor to yesterday (`recap.period.dayYesterday`)

When user picks **Semaine / Mois / Année** from the select, shortcuts hide or disable.

## Prev / next navigation

**Unchanged**: **◀** / **▶** chevrons (or text buttons with `recap.prev` / `recap.next` aria-labels) navigate **within the selected granularity** only (one day, ISO week, calendar month, calendar year).

Layout order below heatmap (see [ui-routes.md](ui-routes.md)):

```text
[select: Jour ▼]  [Aujourd’hui] [Hier]   (shortcuts when day)
◀   Semaine 42 · 2026   ▶
```

## State wiring

- `onChange` receives full `RecapPeriod` (`granularity`, `anchorDate`, `timeZone`).
- Changing `<select>` value calls `setPeriodGranularity(anchorDate, nextGranularity, timeZone)` preserving anchor where sensible (same helper as today).
- Deep links `?period=` remain valid (see ui-routes).

## Test IDs

| `data-testid` | Element |
|---------------|---------|
| `recap-period-granularity-select` | `<select>` |
| `recap-period-prev` | Previous control |
| `recap-period-next` | Next control |
| `recap-period-day-today` | Today shortcut (if present) |
| `recap-period-day-yesterday` | Yesterday shortcut (if present) |

## FR mapping

| FR | Mechanism |
|----|-----------|
| FR-004 | Four granularities via select + prev/next |
| FR-005 | Same aggregation; only bounds differ |
| SC-004 | ≤ 3 taps: open Récap → change select → prev/next |
