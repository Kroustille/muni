# Contract: Plants UI routes & navigation

**Applies to**: **Plantes** area shell, French labels (FR-001), no-guilt empty states (FR-013, SC-005).

## Primary entry

| Route | Purpose |
|-------|---------|
| `/plants` | Plant list + quick-add (default) |

## Detail routes

| Path | Entity |
|------|--------|
| `/plants/[id]` | `plant` + care actions |
| `/plants/potager` | P2 — `vegetable_culture` list (subsection) |
| `/plants/potager/[id]` | P2 — culture detail + milestone buttons |

## Navigation placement

- **OD-013-5**: Dedicated typed-domain entry in main shell (same prominence pattern as **Entraînement** / **Musique — pratique**).
- Icon + label from i18n keys `plants.nav`, `plants.potager.nav`.

## List UX (P1 + P2)

| Element | P1 | P2 |
|---------|----|----|
| Quick-add | Title only at list footer | — |
| Row subtitle | Optional — | **Dernier arrosage** date or « — » (US6) |
| Location filter | — | Chips **Intérieur** / **Extérieur** / **Les deux** (tag **`both`** in both outdoor+indoor filters) |
| Potager entry | — | Link or tab to `/plants/potager` |

**Forbidden copy**: « en retard », overdue badges, streak loss (009 anti-pattern).

## Empty states (copy direction)

- Plants: « Aucune plante — un nom suffit pour commencer »
- Potager: « Aucune culture enregistrée »
- Seasonal hints: « Ajouter un rappel saisonnier » (optional, not blocking)

## Deep links from [011](../011-periodic-recap/spec.md)

Recap **Plantes** lines MAY deep-link to `/plants/[id]` or `/plants/potager/[id]` via `deepLinkHref` — implemented in **011** recap UI, not **013** list.

## FR mapping

| FR | Route / UX |
|----|------------|
| FR-001 | `/plants` |
| FR-008, US6 | List last-watered display |
| FR-010 | Potager routes |
