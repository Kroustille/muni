# Muni — design specification (draft)

**Status:** locked for implementation (Valentin 2026-10-16)  
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
4. **Light and dark** — both themes are first-class (ink + teal in each). User picks **Clair**, **Sombre**, or **Système** in Réglages; preference persists on device. Default **Système** matches OS until the user overrides.
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
- **Raven (locked):** **calm, friendly** raven — rounded shapes, soft eye, no sharp horror-Norse vibe. Use for app icon, select empty states, optional small watermark. Single-color or two-tone max; never a chatty mascot.
- **Feather / bookmark:** optional divider or list empty-state illustration (SVG, one color).

### 4.2 Color system

Replace generic indigo while keeping semantic colors for ratings. **Accent (locked): B — cool ink + teal.** **Home cards (locked):** type **color stripe + Lucide icon** per list. **Density (locked):** airy spacing (keep generous `p-4`, `gap-3`, min-h-11 targets).

**Light (ink + teal)**

| Token | Role | Value | Notes |
|-------|------|-------|--------|
| `--background` | Page | `#f4f6f8` | Cool mist, not warm paper |
| `--foreground` | Text | `#0f172a` | Slate-900 ink |
| `--surface` | Cards, sheets | `#ffffff` | |
| `--border` | Hairlines | `#e2e8f0` | Slate-200 |
| `--muted` | Secondary text | `#64748b` | |
| `--accent` | Primary CTA, links | `#0d9488` | Teal-600 |
| `--accent-foreground` | On accent | `#f0fdfa` | |

**Dark (ink + teal)**

| Token | Role | Value |
|-------|------|-------|
| `--background` | Page | `#020617` |
| `--foreground` | Text | `#f1f5f9` |
| `--surface` | Cards | `#0f172a` |
| `--border` | | `#334155` |
| `--muted` | | `#94a3b8` |
| `--accent` | | `#14b8a6` | Teal-500 |
| `--accent-foreground` | | `#042f2e` |

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

### 4.3 Typography (locked)

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

Routes stay the same; **layout and chrome** differ by breakpoint (see §5.1). Hierarchy:

1. **Home** — overview + recent (memory feed), not a spreadsheet of counts.
2. **List** — title + filters + content; catalog actions grouped in header.
3. **Detail** — edit in place; type-specific fields grouped with subtle section labels.
4. **Search** — global, type label per row (already started).

### 5.1 Mobile vs desktop (locked intent)

| | **Mobile** (&lt; `md`, ~768px) | **Desktop** (`md+`) |
|---|-------------------------------|---------------------|
| **Primary job** | **Capture** — quick add, scan, catalog in context | **Browse & curate** — scan lists, search, edit detail |
| **Navigation** | Bottom bar: Accueil, Recherche, **+**, Réglages | **Left sidebar**: list types + Accueil + Recherche + Réglages |
| **Quick add** | Center **+** FAB (thumb reach) | **No FAB** — “Ajouter” in list header / toolbar; global add in sidebar footer or `⌘K` later |
| **Home** | 2-column card grid + recent | **Wider**: 3-column grid or list+detail teaser; recent as table-like rows with type |
| **Lists** | Full-width rows, bottom sheets for filters | **Max width ~`4xl`** content column; filters inline; optional **split**: list left, detail right when an item selected (phase later) |
| **Sheets** | Bottom sheets for quick-add / catalog | **Centered modal** or **right drawer** (same flows, desktop-appropriate surface) |
| **Density** | Airy (44px targets) | Airy but **more horizontal space** for metadata (author, status, rating on one line) |

**Breakpoint:** Tailwind `md` (768px). Use `useIsMobile()` / CSS consistently — desktop is not “stretched phone UI.”

**Constitution note:** Mobile capture speed (SC-002) unchanged; desktop may use more clicks if browse is faster (e.g. click list type in sidebar).

### 5.2 Theme control

- **Settings → Apparence:** segmented control **Clair | Sombre | Système**.
- Persist in `localStorage` key `muni-theme` (or `host.kv` when available).
- Apply `class="light"` / `class="dark"` on `<html>`; **Système** = `prefers-color-scheme` only (remove class or `data-theme="system"` + script).
- Tailwind: extend dark variant to support class-based dark **and** system fallback when theme is system.
- Both palettes use §4.2 tokens; audit contrast in each.

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

### Phase D — Theme picker

- [ ] `ThemeProvider` + Settings appearance control (Clair / Sombre / Système).
- [ ] Class-based dark + system; update `globals.css` / Tailwind dark variant.
- [ ] Amend **FR-023** in `specs/001` (system default + user override).
- [ ] E2E: forced light and forced dark via settings (not only emulate OS).

### Phase E — Desktop shell

- [ ] `AppShell` with `SidebarNav` (desktop) vs `BottomNav` (mobile).
- [ ] Hide center FAB on `md+`; expose Ajouter on list headers + sidebar action.
- [ ] Desktop home layout (wider grid / recent list).
- [ ] Quick-add / catalog: modal or drawer on desktop instead of full-width bottom sheet only.

### Phase F — Polish

- [ ] Motion tokens; reduced-motion.
- [ ] Optional list+detail split on desktop (later).

**Out of scope:** user-chosen accent colors, cover art grids, social sharing cards.

---

## 7. Success criteria

- A new user says the app feels **cohesive** and **purpose-built**, not “default Next app.”
- Each list type is **recognizable in <1s** on home without reading every label.
- Light and dark screenshots look like **one brand**, not inverted accidents.
- No regression to capture speed (SC-002: add within 2 taps + title from a list).

---

## 8. Decisions log

| # | Topic | Decision |
|---|--------|----------|
| 2 | Titles | **Fraunces** for headings |
| 3 | Raven | **Yes** — calm, friendly; icon + light empty-state use |
| 4 | Home cards | **Type color stripe + icons** (table §4.2) |
| 1 | Accent mood | **B — cool ink + teal** (§4.2) |
| 5 | Density | **Airy** |
| 6 | Themes | **Light + dark** first-class; **Clair / Sombre / Système** in settings |
| 7 | Desktop | **Browse-first** shell (sidebar, no FAB, wider layouts) per §5.1 |

### 8.1 Accent options explained

Two coherent palettes for the *same* product soul; only the **primary accent** (`--accent`, links, FAB, active nav) changes.

**A — Warm amber (paper & candle)**  
- Feel: carnet on a kitchen table, late afternoon, personal and welcoming.  
- Light accent ~`#b45309` (amber-700); dark ~`#fbbf24`.  
- Pairs naturally with **warm paper backgrounds** and a **friendly raven** (soft browns/grays, not cold).  
- Best if Muni should feel like a **companion notebook**.

**B — Cool ink + teal (desk at night)**  
- Feel: deep **ink** neutrals (blue-black text, cool gray surfaces) + **teal** accent (~`#0d9488` / `#14b8a6` in dark).  
- Less “cozy paper”, more **focused tool**: calm, precise, slightly literary.  
- Teal reads modern and clear on mobile; can still stay friendly with rounded UI and a soft raven.  
- Best if Muni should feel like a **quiet studio** rather than a scrapbook.

Both respect system light/dark. List-type stripe colors (§4.2) stay the same in either option.

**Chosen:** **B** with airy layout.

---

## 9. Next step

Execute **Phase A → B** from §6; track in **`specs/005-design-system`** when created.

---

## 10. References

- [Constitution](../.specify/memory/constitution.md) — capture speed, French UI, system theme.
- [UI routes contract](../specs/001-typed-lists-companion/contracts/ui-routes.md) — screens and behaviors.
- Current tokens: `src/app/globals.css`.
- Rating semantics: `src/components/rating-colors.ts`.
