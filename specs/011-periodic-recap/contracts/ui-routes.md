# Contract: Recap UI routes and shell

**Applies to**: `src/app/(app)/recap/*`, French i18n, app shell navigation.

## Routes

| Route | Purpose | Phase |
|-------|---------|-------|
| `/recap` | Periodic recap — period controls, optional desktop heatmap, domain-grouped achievement lists | A (MVP v1: day/week/month/year) |

**Default query/state**: Weekly period for **current ISO week** on first visit (FR-004, US1).

**Deep links** (optional MVP v1):

| Query | Effect |
|-------|--------|
| `?period=week` \| `month` \| `day` \| `year` | Initial granularity (all four in v1) |
| `?date=YYYY-MM-DD` | Anchor date |

Invalid query → fall back to defaults.

## Page layout (`RecapPage`)

1. **Header**: title **Récap** + period granularity control (tabs or select: **Semaine**, **Mois**, **Aujourd’hui** / **Hier** (or day picker), **Cette année**).
2. **Period navigation**: **◀ période précédente** / **période suivante ▶** with French label for active range.
3. **Heatmap slot** (desktop only): see [recap-activity-heatmap.md](recap-activity-heatmap.md) — `null` below `md`.
4. **Intro line**: celebratory/neutral one-liner (non-guilt).
5. **Sections**: `RecapDomainSection` per non-empty domain; count in header **Livres (3)**.
6. **Empty state**: neutral copy when `snapshot.empty` (US1 scenario 7).

## Row interaction

- Rows are **read-only** (FR-002).
- Optional: tap row → navigate to item detail or fitness workout detail (`deepLinkHref`).

## Accueil teaser (optional, US3)

- Component on `/` only when enabled in implementation plan (OD-011-7).
- Shows weekly **totalCount** or gentle CTA **Voir le récap**.
- Link → `/recap?period=week` (same default as nav).
- Must not be required to use recap (FR-010).

## Yearly recap isolation (FR-018)

- Year period UI lives only on `/recap`.
- No embed of 002/003 goal progress components; no required links to `/books/.../goals` or movie goal routes.

## i18n keys (minimum set)

- `recap.nav`, `recap.title`, `recap.period.week`, `recap.period.month`, `recap.period.day`, `recap.period.year`
- `recap.prev`, `recap.next`, `recap.empty`, `recap.section.*` (per domain)
- `recap.homeTeaser.title`, `recap.homeTeaser.cta`
- `recap.heatmap.legend`, `recap.heatmap.a11yDay`

## FR mapping

| FR | UI area |
|----|---------|
| FR-001 | `/recap` + French strings |
| FR-004–FR-005 | Period controls |
| FR-009 | Intro + empty states |
| FR-010 | Nav + optional home teaser |
| FR-018 | Standalone yearly UX |
| FR-019 | Heatmap slot desktop only |
