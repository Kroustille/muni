# Research: Recipe source book / cookbook citation (010)

## Problem

Users want to remember **where a recipe comes from** (cookbook title, author, page) when adding or cooking. Muni already has a **books library** (`002-books-library`) with reading lifecycle (status, rating, pause, lending, quotes, catalog lookup). That list answers “what am I reading?” — not “which page did I copy this recipe from?”. This feature must stay clearly separate in product language and data semantics.

## Options considered

### Option A — Bibliographic fields on the recipe (no link to books library)

Store an optional **source reference block** on each recipe: book title, author, page(s), optional ISBN. No foreign key to a book item. User types or pastes text; works fully offline; no dependency on catalog or reading status.

| Pros | Cons |
|------|------|
| Smallest MVP; aligns with **Capture speed** and **YAGNI** (constitution II, IV) | Same physical book may appear twice (library row + recipe text) |
| No confusion with **En pause** / **Lu** / lending on library books | No auto-fill from ISBN scan on recipes (unless added later) |
| Field-level sync matches existing recipe pattern | Search across recipes by source is text match only |
| Clear UX copy: “Ouvrage source”, not “Ajouter à lire” | |

### Option B — Optional link to a books library item with role “source / cookbook”

Recipe holds a reference to a `book` item id plus page on the recipe. Library item might carry a tag or role distinguishing “cookbook I cook from” vs “novel to read”.

| Pros | Cons |
|------|------|
| Single canonical book record; ISBN/catalog metadata reused | **High coupling**: adding a recipe requires a library book or a new flow to create one |
| Could open book detail from recipe | Reading status changes (finished, lent) unrelated to recipe provenance |
| | Offline: user must have book row locally before linking |
| | Product rules explode (link to edition? work group? soft-deleted book?) |

### Option C — Hybrid: free-text source OR pick from books library (cookbook tag)

User either fills bibliographic fields **or** picks a library book and optional page; both paths stored with a unified display.

| Pros | Cons |
|------|------|
| Flexible for users who catalog cookbooks and those who don’t | **Two input modes** = more UI, tests, and sync edge cases for MVP |
| Best long-term ergonomics for power users | Violates “smallest slice” unless phased |

## Decision (MVP)

**Adopt Option A for MVP** (this spec). Treat the recipe source block as **citation metadata**, not a library membership.

**Future evolution (out of MVP, not blocked):** Phase 2+ may add **optional** “Remplir depuis ma bibliothèque” (hybrid picker) that **copies** title/author/ISBN into the recipe source block without maintaining a live link — or, if Valentin prefers, a true link (Option B) as a separate spec once cookbook tagging in 002 is defined.

## Rejected for MVP

- **Option B** as required or primary path — rejected (library workflow mismatch, capture friction).
- **Option C** in the first release — rejected (dual-mode complexity); deferred as enhancement after Option A ships.
- **Auto-adding recipe source to books-to-read** — rejected (explicit non-goal).
- **Deep linking** from recipe to Open Library / scan on recipe form — rejected (reuse 002 entry points only if hybrid is planned later).

## Product copy (French UI)

Suggested labels (planning may refine keys):

| Concept | French label |
|---------|----------------|
| Section | **Ouvrage source** (optional) |
| Book title | **Titre de l’ouvrage** |
| Author | **Auteur** |
| Page | **Page(s)** (accepts “42”, “p. 42–44”) |
| ISBN | **ISBN** (optional) |

Help text (detail): *Référence bibliographique — distincte de votre liste de livres à lire.*

## Sync & merge (product-level)

- Source fields are **optional**; empty block means “no source recorded”.
- When the user edits source on two devices, **each source sub-field** follows the same **last-write-wins per field** rule as other recipe fields (constitution + 001 recipe ingredients/steps policy for composite lists does not apply here — these are scalar citation fields).
- Deleting a recipe or soft-delete sync behaves like other recipe items; source data travels with the recipe row.
