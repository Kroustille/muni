# Contract: No nested HTML forms (001 addendum)

**Applies to**: Quick-add sheet, catalog search/preview sheets, `ItemDetailForm`, list add flows for typed items.

**Background (2026-10-28)**: Invalid **`<form>` inside `<form>`** breaks HTML semantics, confuses Enter-key submit, and causes unpredictable browser behavior (often the inner form never submits correctly).

## Observed bug (books add flow)

| Location | Outer form | Inner form(s) |
|----------|------------|---------------|
| `quick-add-context.tsx` | Wraps manual book/movie fields in `<form onSubmit={submit}>` | `BookTitleCatalogFlow` → `BookCatalogSearchSheet` → `<form>` (search); `CatalogPreview` → `<form>` (confirm). BottomSheet renders **in place** in the React tree (not portaled outside the outer form), so opening title search from quick-add nests forms in the DOM. |
| Same pattern | Quick-add `movie` kind | `MovieCatalogFlow` → `MovieCatalogSearchSheet` / preview forms inside outer quick-add form. |
| `ItemDetailForm.tsx` | Single `<form>` for item save | **No nested form today** on book detail (catalog is on list header, not inside detail form). Keep it that way — do not embed catalog `<form>` components inside `ItemDetailForm`. |
| `list-page-content.tsx` | No outer form | Catalog sheets are safe (only one form per sheet). |

**Acceptance (regression)**:

1. **Given** the user opens quick-add for **book** on mobile or desktop, **When** they open **Rechercher par titre** and the catalog sheet is open, **Then** the document MUST NOT contain `form form` (no nested form elements).
2. **Given** the same for **movie** quick-add and catalog search, **When** the search sheet is open, **Then** no nested forms.
3. **Given** book list **Rechercher par titre** (not inside quick-add), **When** the sheet is open, **Then** at most one `<form>` per sheet (allowed).

## Fix approach (implementation)

**P1 — Quick-add shell**

- Replace the quick-add wrapper **`<form>`** with a **`<div>`** for book/movie/recipe/etc. manual add: primary **Ajouter** button uses `type="button"` + `onClick` calling the same submit handler (title validation unchanged).
- Keep `<form>` only if no catalog child can mount while open **or** catalog flows are moved outside (P2).

**P2 — Catalog components**

- Refactor `book-catalog-search.tsx`, `catalog-preview.tsx`, `movies/catalog-search.tsx`, `movies/catalog-preview.tsx`: prefer **`<div>`** + `role="search"` / explicit submit buttons (`type="button"`) instead of `<form onSubmit>`, **or**
- Render catalog `BottomSheet` via **React portal** to `document.body` so sheets are never DOM descendants of an ancestor form.

**P3 — Guardrail**

- Playwright smoke: open quick-add book → open title catalog → assert `document.querySelectorAll('form form').length === 0`.
- Optional unit/DOM test helper exported for reuse.

## Related specs

- Books catalog UI: [002 contracts/ui-book-scan.md](../../002-books-library/contracts/ui-book-scan.md)
- Movies: [003 contracts/ui-movie-search.md](../../003-films-tv-library/contracts/ui-movie-search.md)
- Foundation undo/delete: FR quick-add in [spec.md](../spec.md) (immediate actions, no blocking dialogs except where product requires)
