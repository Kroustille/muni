# Contract: Recipe detail — Ouvrage source

**Applies to**: FR-007, US4.

## Visibility

- Render section **only when** `item.type === "recipe"` **and** `item.cookbookId` is non-null after load.
- Resolve cookbook via local `CookbookRepository.get(cookbookId)`; if missing (stale), show title placeholder i18n `recipe.source.missingCookbook` with id hidden from user — trigger sync retry in background.

## Placement (OD-010-4)

On recipe detail/edit read-only block: **after steps**, **before notes**.

## Content order

| Row | Source | Notes |
|-----|--------|-------|
| Title | Cookbook `title` | Plain text, primary line |
| Author | Cookbook `author` | Omit row if null/empty |
| Page(s) | Item `sourcePage` | Omit row if null/empty |
| ISBN | Cookbook `isbn` | Plain text; omit if empty; no external link in MVP |

Section heading: **Ouvrage source** (`recipe.source.section`).

## Empty states

- No cookbook → **omit entire section** (no “Non renseigné”).
- Cookbook set but page empty → show title/author/isbn only.

## List view

Recipe list rows **unchanged** in MVP (no source subtitle).

## Component target

`src/components/recipe/recipe-source-section.tsx` used from `src/app/(app)/items/[id]/page.tsx`.
