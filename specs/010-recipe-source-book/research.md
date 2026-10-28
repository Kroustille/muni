# Research: Recipe source book / cookbook citation (010)

## Problem

Users want to remember **where a recipe comes from** (cookbook title, author, page) when adding or cooking. Muni already has a **books library** (`002-books-library`) with reading lifecycle (status, rating, pause, lending, quotes, catalog lookup). That list answers “what am I reading?” — not “which page did I copy this recipe from?”. This feature must stay clearly separate in product language and data semantics.

## Options considered

### Option A (legacy) — Bibliographic fields on the recipe only (no catalog, no link)

Store an optional **source reference block** on each recipe: book title, author, page(s), optional ISBN. No cookbook entity; user retypes text per recipe.

| Pros | Cons |
|------|------|
| Smallest schema | Same book retyped with typos across recipes |
| Fully offline | No single place to fix author/ISBN for many recipes |
| | Harder P2 “all recipes from this book” without normalization |

**Status:** Rejected as MVP (2026-10-28 product decision) — replaced by **cookbook registry + combobox** below.

### Option B — Optional link to a books library item with role “source / cookbook”

Recipe holds a reference to a `book` item id plus page on the recipe. Library item might carry a tag or role distinguishing “cookbook I cook from” vs “novel to read”.

| Pros | Cons |
|------|------|
| Single canonical book record; ISBN/catalog metadata reused | **High coupling**: adding a recipe requires a library book or a new flow to create one |
| Could open book detail from recipe | Reading status changes (finished, lent) unrelated to recipe provenance |
| | Offline: user must have book row locally before linking |
| | Product rules explode (link to edition? work group? soft-deleted book?) |

**Status:** Rejected for MVP.

### Option C — Hybrid: free-text source OR pick from books library (cookbook tag)

User either fills bibliographic fields **or** picks a library book and optional page; both paths stored with a unified display.

| Pros | Cons |
|------|------|
| Flexible for users who catalog cookbooks and those who don’t | **Two input modes** = more UI, tests, and sync edge cases for MVP |
| Best long-term ergonomics for power users | Violates “smallest slice” unless phased |

**Status:** Rejected for MVP (includes **no books-to-read picker** on recipe form).

### MVP model — User-scoped **cookbook catalog** + **single combobox** (manual only)

**Cookbook** rows: user-owned catalog with **title**, optional **author**, optional **ISBN**, synced like other private items. **Recipe** stores optional **`cookbookId`** + optional **page(s)**.

**UX:** One control on recipe add/edit — **search existing cookbooks** or **create new** in the same combobox (autocomplete-with-create). No reading list, no catalog scan on recipe form in MVP.

| Pros | Cons |
|------|------|
| Reuse one cookbook across many recipes; edit metadata once | Second entity type to sync (cookbooks + recipe ref) |
| Clear separation from `002` (no shared item type / no reading status) | User may still duplicate title in library and cookbook |
| Manual-only keeps capture fast and offline-simple | Orphan cookbooks possible if user creates but clears recipes |
| Matches Valentin’s **manual input/select only** decision | |

## Decision (MVP)

**Adopt the cookbook catalog + single combobox model** (this spec). Cookbooks are **not** books-to-read items; they are seeded **only** when the user creates through the recipe combobox (or edits cookbook metadata if planning exposes it).

**Future evolution (out of MVP, not blocked):** Optional “Remplir depuis ma bibliothèque” that **copies** metadata into a new cookbook row or links read-only — separate spec once cookbook vs library rules are stable.

## Rejected for MVP

- **Legacy Option A** (inline fields only on recipe) — rejected in favor of catalog + `cookbookId`.
- **Option B** as required or primary path — rejected (library workflow mismatch).
- **Option C** / books-to-read picker on recipe form — rejected (dual domain + reading status confusion).
- **Auto-adding recipe source to books-to-read** — rejected (explicit non-goal).
- **Deep linking** from recipe to Open Library / scan on recipe form — rejected (library entry points only if hybrid is planned later).

## Product copy (French UI)

Suggested labels (planning may refine keys):

| Concept | French label |
|---------|----------------|
| Section | **Ouvrage source** (optional) |
| Cookbook field | **Ouvrage** or **Livre / ouvrage** (combobox: search or create) |
| Create hint | e.g. **Créer « … »** when no match |
| Author (on cookbook) | **Auteur** |
| Page (on recipe) | **Page(s)** (accepts “42”, “p. 42–44”) |
| ISBN (on cookbook) | **ISBN** (optional) |

Help text (detail): *Référence bibliographique — distincte de votre liste de livres à lire.*

## Sync & merge (product-level)

- **Cookbook** fields: optional author/ISBN; title required on create; per-field **last-write-wins** like other scalars.
- **Recipe** `cookbookId` and **page(s)**: per-field LWW; clearing `cookbookId` clears page.
- Cookbook and recipe rows participate in the same offline-first outbound/inbound sync as other user items; soft-delete rules for recipes carry `cookbookId`/page with the recipe row.
- Referenced cookbooks are **not** deleted when a recipe is deleted in MVP (catalog row may become unreferenced).

## Open questions (reduced)

- ~~**Cookbook edit surface**~~ — **Resolved (plan OD-010-3)**: optional **Auteur** / **ISBN** on recipe add/edit when a cookbook is selected; upsert cookbook row on save; title only via combobox.
- **Orphan cookbooks:** Keep in catalog in MVP (no garbage collection required).
- ~~Partial source / orphan page without title~~ — resolved: page requires selected cookbook.

## Planning decisions (2026-10-28)

| ID | Decision | Rationale |
|----|----------|-----------|
| OD-010-1 | Sync routes `/api/sync/cookbooks/push` and `/pull` | Matches book quotes / fitness split; keeps item payload smaller |
| OD-010-2 | Item fields `cookbook_id`, `source_page` on wire | Consistent snake_case with existing item sync |
| OD-010-3 | Inline author/ISBN on recipe form | No standalone cookbook admin screen; satisfies US2 metadata update |
| OD-010-4 | Detail block after steps, before notes | Keeps notes at bottom; source visible near procedural content |
| OD-010-5 | Collapsible source section after title on add | Capture speed — title-only path unchanged |
| OD-010-6 | Title max 500 chars | Accommodate long cookbook names without list UI change |
| OD-010-7 | P2 search via in-memory join to cookbook title | Smallest change to `search.ts`; no Postgres full-text in MVP |
