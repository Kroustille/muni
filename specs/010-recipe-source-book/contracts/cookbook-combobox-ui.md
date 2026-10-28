# Contract: Cookbook combobox (recipe add/edit)

**Applies to**: FR-003, FR-005, US1, US2, US3. French copy from [research.md](../research.md) § Product copy.

## Placement

- **Add form**: Collapsible section **Ouvrage source** (default collapsed) immediately **after recipe title**, before ingredients (OD-010-5).
- **Edit form**: Same section expanded when `cookbookId` set; collapsed when empty.

## Controls

| Control | Label (i18n key TBD) | Behavior |
|---------|----------------------|----------|
| Combobox | `recipe.source.cookbook` → **Ouvrage** | Single field: filter catalog + select row |
| Create row | `recipe.source.create` → **Créer « {query} »** | Shown when trimmed query non-empty and no case/accent-insensitive title match |
| Page | `recipe.source.page` → **Page(s)** | Optional text; disabled visually when no cookbook selected |
| Help | `recipe.source.help` | *Référence bibliographique — distincte de votre liste de livres à lire.* |

When a cookbook is **selected** or **newly created**, show optional fields (upsert cookbook on save):

| Field | Label | Max length |
|-------|-------|------------|
| Author | **Auteur** | 200 |
| ISBN | **ISBN** | 32 |

Title of cookbook is **only** set via combobox selection/create (not a separate title field when editing author/ISBN).

## Interaction

1. User types → filter `listAll()` cookbooks with `normalizeText` on title and author; max **20** options.
2. User picks option → set `cookbookId`; load author/ISBN into optional fields.
3. User picks **Créer** → on save, create cookbook with trimmed title (reject whitespace-only).
4. User clears combobox → clear `cookbookId`, `sourcePage`, and optional author/ISBN UI; do not delete cookbook row (FR-008).
5. **No** navigation to books library, **no** scan, **no** datalist-only (must support explicit create — extend beyond `GroupCombobox`).

## Accessibility

- `role="combobox"`, `aria-expanded`, listbox for options (pattern: `RecommendedByInput`).
- Create action is a listbox option or adjacent button — keyboard activatable.

## Save pipeline

On submit:
1. If create pending → `upsertCookbook({ title, author, isbn })` → id.
2. If `cookbookId` null → force `sourcePage` null before item upsert.
3. Item upsert with `cookbookId`, `sourcePage` (trimmed page or null).

## Component target

`src/components/fields/cookbook-combobox.tsx` consumed from `recipe-fields.tsx` or wrapper `recipe-source-fields.tsx`.
