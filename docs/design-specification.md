# Muni — design specification (draft)

**Status:** draft for review with Valentin  
**Last updated:** 2026-10-16  
**Scope:** visual identity, UX tone, and UI system — not feature requirements (those stay in `specs/`).

---

## 1. Why this document

Muni works functionally but reads as a **generic Tailwind scaffold**: neutral zinc, default indigo accent, text-only navigation, mixed border tokens (`border-border` vs `border-black/10`), no typographic voice, no motif tying the product to *memory* or to *typed lists*. Users should feel they opened a **personal companion**, not another admin panel.

This spec defines **character** (what Muni should feel like) and **system** (how we express it in UI), with a phased path from today’s UI to a coherent product.

---

## 2. Product soul

### What Muni is

- **Offline-first companion** for *your* lists: courses, livres, films, recettes, musique — not a social feed or a generic notes app.
- **Name:** from **Muninn**, Odin’s raven of *memory* — not omniscience, not performance. You curate what you want to remember and revisit.
- **Language:** French UI; warm, clear, never corporate English creep in copy.
- **Ethics:** private, self-hosted, no analytics — the interface should feel **calm and trustworthy**, not “growth-optimized.”

### One-sentence experience goal

> *Ouvrir Muni, c’est retrouver son carnet de vie — rapide à alimenter, agréable à parcourir, sans bruit.*

### Personality keywords

| We are | We are not |
|--------|------------|
| Calm, attentive, personal | Loud, gamified, viral |
| Typographic, legible | Illustration-heavy clutter |
| Warm neutrals + one accent | Purple-gradient “AI app” |
| Confident minimalism | Dashboard density |
| French cadence (short labels) | Jargon or English microcopy |

### Design principles (aligned with constitution)

1. **Capture stays sacred** — primary actions stay thumb-reachable; visual flair never costs a tap or a field.
2. **Type is identity** — each list type has a recognizable color/icon treatment; the brain learns “green = courses” without reading.
3. **Offline feels solid** — empty states and sync status feel reliable, not anxious (no red panic unless real errors).
4. **System theme only** — light/dark follow OS; both modes must feel *intentional*, not inverted leftovers.
5. **Accessible first** — contrast, 44px targets, visible focus; beauty includes low-vision and outdoor use.

---

## 3. Audit of the current UI (baseline)

| Area | Today | Gap |
|------|--------|-----|
| Color | `#4f46e5` indigo accent; zinc surfaces | Reads as default shadcn/Tailwind; no link to memory/warmth |
| Typography | System stack only | No hierarchy or brand voice |
| Home | 2×2 count cards, plain borders | No type icons, no welcome tone, weak “Ajouts récents” |
| Nav | Text labels + black/white FAB `+` | No icons; FAB doesn’t express “add to memory” |
| Lists | Rows = border + link + controls | Functional; little delight or type character |
| Tokens | `globals.css` CSS variables | Good foundation; underused vs hardcoded `black/10` |
| Ratings | Strong tier colors | Rare burst of personality — extend this discipline to types |
| Motion | Mostly none | OK for v1; micro-motion later for confirm/sync |

---

## 4. Visual direction (proposed)

### 4.1 Narrative motif — *le carnet*

Avoid literal Viking branding. Use **subtle memory metaphors**:

- **Carnet / page:** soft surfaces, slight paper warmth in light mode; ink-like foreground in dark mode.
- **Raven:** at most a **small mark** (app icon, empty state, splash) — single-color, geometric, not mascot cosplay.
- **Feather / bookmark:** optional divider or list empty-state illustration (SVG, one color).

### 4.2 Color system (proposal)

Replace generic indigo with a palette that feels **ink + amber** (memory, candlelight, old paper) while keeping semantic colors for ratings.

**Light**

| Token | Role | Suggested value | Notes |
|-------|------|-----------------|--------|
| `--background` | Page | `#f7f5f0` | Warm paper, not pure white |
| `--foreground` | Text | `#1c1917` | Stone-900 ink |
| `--surface` | Cards, sheets | `#fffcf7` | Slightly lifted paper |
| `--border` | Hairlines | `#e7e2d9` | Warm border |
| `--muted` | Secondary text | `#57534e` | |
| `--accent` | Primary CTA, links | `#b45309` | Amber-700 — warm, not startup purple |
| `--accent-foreground` | On accent | `#fffbeb` | |

**Dark**

| Token | Role | Suggested value |
|-------|------|-----------------|
| `--background` | Page | `#0c0a09` |
| `--foreground` | Text | `#f5f5f4` |
| `--surface` | Cards | `#1c1917` |
| `--border` | | `#292524` |
| `--muted` | | `#a8a29e` |
| `--accent` | | `#fbbf24` | Amber-400 for dark |
| `--accent-foreground` | | `#1c1917` |

**List type accents** (secondary — badges, card stripe, icon tint; not full backgrounds):

| Type | Hue | Intent |
|------|-----|--------|
| Shopping | Sage `#65a30d` | Fresh, errands |
| Books | Burgundy `#9f1239` | Library |
| Movies | Indigo `#4338ca` | Cinema night (only movies use cool hue) |
| Recipes | Orange `#c2410c` | Kitchen warmth |
| Music artists | Violet `#7c3aed` | Stage |
| Music tracks | Sky `#0284c7` | Playback |

Keep **rating tier colors** as today; they already encode meaning.

### 4.3 Typography (proposal)

| Role | Font | Fallback | Usage |
|------|------|----------|--------|
| **Display / headings** | [Fraunces](https://fonts.google.com/specimen/Fraunces) (variable) | Georgia, serif | Screen titles, empty states — “carnet” voice |
| **UI / body** | [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) | system-ui | Lists, forms, nav |
| **Numbers** | Source Sans 3 `tabular-nums` | — | Counts, ratings |

- Load via `next/font` (no layout shift).
- **H1** list pages: Fraunces 600, ~1.35rem; body 16px min on mobile.
- Avoid more than two families.

### 4.4 Iconography

- **Set:** [Lucide](https://lucide.dev) (stroke, 1.5px) — consistent, MIT, works with Tailwind.
- **Nav:** home, search, settings + centered “add” (plus or pen-on-page).
- **Home cards:** one icon per list type; optional subtle tinted circle behind icon.
- **Rules:** 24px in nav; 20px inline; always paired with text or `aria-label`.

### 4.5 Shape, space, elevation

- **Radius:** `rounded-xl` (12px) cards; `rounded-2xl` bottom sheets (already close).
- **Spacing:** 4px grid; list pages `p-4`, gap-3 between rows.
- **Shadow:** sparingly — FAB and sheet only: `shadow-lg` warm tint, not gray blur stacks.
- **Borders:** prefer `border-border` everywhere; eliminate ad hoc `black/10`.

### 4.6 Components (target patterns)

| Component | Direction |
|-----------|-----------|
| **Home list card** | Surface + left accent stripe (type color) + icon + label + large count |
| **List row** | Calmer row: title prominent; type/meta muted; rating badge unchanged |
| **Primary button** | `bg-accent`, min-h-11, medium weight |
| **Secondary / chips** | `bg-surface` + border; active chip filled accent |
| **Bottom nav** | Surface background, top border; active tab = accent color + icon |
| **FAB (+)** | Accent fill OR ink circle with accent ring — must pop but not “Material Demo” |
| **Search field** | Full-width, surface inset, magnifier icon, placeholder from i18n |
| **Empty state** | Fraunces heading + one line of guidance + optional raven line-art |
| **Sync status** | Discrete pill; success muted green, syncing subtle pulse |

### 4.7 Motion (phase 2)

- Sheet: slide-up 200ms ease-out.
- List item add: optional 150ms fade-in (respect `prefers-reduced-motion`).
- No parallax, no celebration confetti.

### 4.8 Copy tone (French)

- Prefer **tu** implicitly (infinitives / short imperatives): “Ajouter”, “Rechercher”, not “Veuillez”.
- Empty home: explain *one* first step — e.g. “Ajoutez un premier livre ou une course à faire.”
- Errors: factual, brief; no cute error mascots.

---

## 5. Information architecture (visual)

Unchanged routes; **visual hierarchy** should reinforce:

1. **Home** — overview + recent (memory feed), not a spreadsheet of counts.
2. **List** — title + filters + content; catalog actions grouped in header.
3. **Detail** — edit in place; type-specific fields grouped with subtle section labels.
4. **Search** — global, type label per row (already started).

---

## 6. Implementation roadmap

### Phase A — Foundation (1–2 days dev)

- [ ] Unify tokens in `globals.css` (warm palette above or Valentin-approved tweak).
- [ ] Replace hardcoded `border-black/10` / `bg-white` / `dark:bg-black` with semantic tokens.
- [ ] Add `next/font` for Fraunces + Source Sans 3; apply to `layout.tsx`.
- [ ] Document tokens in this file → `docs/design-tokens.md` (optional split).

### Phase B — Shell character (2–3 days)

- [ ] Bottom nav icons + active state (accent).
- [ ] Home cards: icon + type accent stripe.
- [ ] FAB restyle; search entry on home as proper search bar.
- [ ] App icon + `manifest` refresh (simple raven/book mark).

### Phase C — Lists & sheets (ongoing)

- [ ] Row component pass (shared `ListRow` shell).
- [ ] Bottom sheet header typography (Fraunces).
- [ ] Empty states per list type (one illustration pattern).

### Phase D — Polish

- [ ] Motion tokens; reduced-motion.
- [ ] Desktop max-width column (~`max-w-xl` already) — optional wider reading on detail only.

**Out of scope for design v1:** custom themes, user-chosen colors, cover art grids, social sharing cards.

---

## 7. Success criteria

- A new user says the app feels **cohesive** and **purpose-built**, not “default Next app.”
- Each list type is **recognizable in <1s** on home without reading every label.
- Light and dark screenshots look like **one brand**, not inverted accidents.
- No regression to capture speed (SC-002: add within 2 taps + title from a list).

---

## 8. Open decisions (need Valentin)

1. **Warm amber accent** vs **cool ink + teal accent** — which emotional pole fits you?
2. **Fraunces serif** for titles — yes/no? (Alternative: stay sans-only but stronger weight scale.)
3. **Raven motif** — none / icon only / light illustration in empty states?
4. **Type colors** — approve table in §4.2 or simplify to monochrome + icons only?
5. **Density** — keep airy lists or tighter for power users?

Reply with preferences (even bullet answers); we can lock §4–6 and spawn a `specs/005-design-system` implementation track.

---

## 9. References

- [Constitution](../.specify/memory/constitution.md) — capture speed, French UI, system theme.
- [UI routes contract](../specs/001-typed-lists-companion/contracts/ui-routes.md) — screens and behaviors.
- Current tokens: `src/app/globals.css`.
- Rating semantics: `src/components/rating-colors.ts`.
