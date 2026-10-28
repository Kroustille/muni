# Contract: Recap activity heatmap

**Applies to**: `src/components/recap/recap-activity-heatmap.tsx`, `src/components/recap/recap-heatmap-week-columns.ts`, consumed only from `/recap` (FR-019, User Story 7).

## Visibility

| Viewport | Behavior |
|----------|----------|
| All widths | **Mount** at top of recap page above period navigation whenever `RecapSnapshot` is loaded (including empty trailing window — inactive cells only) |
| Narrow (< 768px typical) | Same week-column grid; wrapper **`overflow-x: auto`** (horizontal scroll) so cell size stays legible; legend below grid (wrap OK) |
| Wide (≥ 768px) | Same component; scroll optional if grid fits within page max width |

Do **not** gate mount on `useMediaQuery`, `md:`, or `useIsMobile`.

## Data input

```typescript
type RecapActivityHeatmapProps = {
  days: RecapActivityDay[];  // 365 entries, ascending date
};
```

Accents and French labels come from `recap-domain-accents` + i18n (implementation). Built from `RecapSnapshot.activityDays` (see [recap-aggregation-service.md](recap-aggregation-service.md)).

## Visual (FR-020 — locked)

- GitHub-style **week-column grid**: **7 weekday rows** (ISO Monday → Sunday), **weeks as columns** left→right; padding cells before first / after last day in window.
- **Inactive day**: neutral border/fill (`bg-muted` or equivalent).
- **Active day, one domain**: **full cell** fill with that domain’s accent.
- **Active day, multiple domains**: cell interior split into **vertical micro-segments** (equal width, left→right) in stable domain order; each segment uses domain accent from table.
- **Active day, Musique only**: **full cell** fill with music track accent even when multiple 012 event types occurred (still **one** segment).

| Domain | Accent source |
|--------|----------------|
| `book` | `LIST_TYPE_VISUAL.book.accentColor` (`#9f1239`) |
| `movie` | `LIST_TYPE_VISUAL.movie.accentColor` (`#4338ca`) |
| `music_track` | `LIST_TYPE_VISUAL.music_track.accentColor` (`#0284c7`) |
| `recipe` | `LIST_TYPE_VISUAL.recipe.accentColor` (`#c2410c`) |
| `fitness` | `#0d9488` (OD-011-3) |
| `plants` | `#16a34a` (OD-011-9 — plants shell / 005 extension) |

- **No intensity scale** by `eventCount` in MVP (presence only).
- **Max 6 segments** visible (in-scope domains through **Plantes**); future overflow domains listed in text only (OD-011-10).

## Legend

- Visible French **text legend** below or beside grid: domain label + swatch per in-scope domain.
- Must not rely on color alone (FR-020).

## Tooltip / focus

Each active cell:

- **Hover/focus tooltip**: date + comma-separated domain labels; optional `(N activités)` from `eventCount`.
- **`aria-label` / accessible name**: e.g. `28 octobre 2026 — Livres, Entraînement` (localized date format).

Inactive cells: date only or omitted from tab order (product choice; prefer skip roving tabindex on empty cells).

## Test IDs

| `data-testid` | Element |
|---------------|---------|
| `recap-activity-heatmap` | Root grid (week columns) |
| `recap-activity-heatmap-legend` | Legend |
| `recap-activity-day-{YYYY-MM-DD}` | Cell (active or inactive) |

## Independence from period switcher

Heatmap always reflects **trailing 365 local days** (OD-011-1), **not** the selected week/month list period. Copy may clarify (“Activité des 12 derniers mois”) in i18n.

## Testing

- Unit: `buildRecapHeatmapWeekColumns` pads ISO weeks; segment layout given `domainsPresent` permutations (1, 2, 5 domains); **same day** track listened + composition finished → **one** Musique segment.
- Playwright: heatmap visible at default and **iPhone** viewport; multi-segment cell when seeded (US7 scenarios 1–3); narrow viewport still shows grid (scenario 4).
- a11y: active cell accessible name includes domain names (scenario 5).

## Reuse note

Book/movie domain heatmaps (`reading-heatmap`, watch insights) remain **separate** UIs on domain screens. Recap heatmap is **multi-domain** and MUST NOT reuse single-accent `HeatmapCell` without extending for segments.

## FR mapping

| FR | Mechanism |
|----|-----------|
| FR-019 | Mount on all viewports; horizontal scroll on narrow |
| FR-020 | Segments, legend, tooltip/a11y |
