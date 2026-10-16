# Feature Specification: Design system (ink + teal)

**Feature Branch**: `005-design-system`

**Created**: 2026-10-16

**Status**: In progress

**Input**: Implement visual identity from `docs/design-specification.md` — tokens, shell, lists, theme, desktop, polish.

**Depends on**: Muni v1 (`001`).

## Scope

Phased rollout A–F per design spec §6. Phases A, B (partial), D, E (partial) landed in `58ce61d`. This feature completes **C**, remaining **B/E**, and **F**.

### Phase C — Lists & sheets

- Shared `ListRowShell` with type stripe (`list-type-visual.ts`).
- Bottom sheet titles use display (Fraunces) typography.
- `ListEmptyState` with raven SVG motif and per-type French copy.

### Phase B remainder

- App icon (`public/icon.svg`) and manifest/metadata icons.

### Phase E remainder

- Verify desktop modal bottom sheets for quick-add and catalog flows (no mobile FAB regression).

### Phase F — Polish

- Motion tokens and bottom-sheet enter animations with `prefers-reduced-motion`.
- Desktop list + detail split on typed list routes (`md+`), preserving mobile navigation to `/items/[id]`.

## Out of scope

- User-chosen accent colors, cover grids, social cards (design spec §6).

## References

- `docs/design-specification.md`
- `src/app/globals.css`
