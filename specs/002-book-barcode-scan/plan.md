# Implementation Plan: Book barcode scan and catalog lookup

**Branch**: `002-book-barcode-scan` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-book-barcode-scan/spec.md`

**Build order (X1)**: Implement **this feature (002) completely** before feature **003** (movies). Feature **004** (music) follows **003**.

## Summary

Add mobile ISBN barcode scanning (continuous until valid ISBN), server-proxied Open Library lookup with short-TTL cache, preview-and-confirm with all fields editable, and silent ISBN dedupe/merge/restore. Extend the book item model and sync schema with ISBN and catalog fields. Desktop unchanged for scan/lookup. Scanner: Barcode Detection API on Android when available; WASM-based scanner always on iOS/PWA.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22, Next.js 15 (existing stack)

**Primary Dependencies**: Existing Muni hexagonal stack; add WASM barcode reader package (e.g. `@undecaf/zbar-wasm` or equivalent evaluated in research.md); Open Library HTTP API via server adapter only

**Storage**: Extend `items` columns / IndexedDB mirror for new book fields; optional `catalog_cache` table on server for ISBN → JSON (TTL)

**Testing**: Vitest unit/integration; Playwright mobile viewport for scan flow (camera mocked or ISBN inject hook); contract tests for lookup route and `BookCatalogLookup` port

**Target Platform**: Mobile PWA (iOS Safari primary); Android Chrome secondary; desktop excluded from scan UI

**Constraints**: X2 server proxy; X3 no offline lookup queue; X4 cache; no API keys in client; French-first metadata normalization in application layer

**Scale/Scope**: Same as v1 — one user, thousands of books

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-first | Pass | Lookup is optional online step; manual add/edit offline |
| II. Capture speed | Pass | Scan + preview still title-first; desktop manual unchanged |
| III. Typed lists | Pass | Book-specific catalog fields only on `book` type |
| IV. Simplicity | Pass | Single provider (Open Library); cache table optional/simple |
| V. Privacy | Pass | Lookup authenticated; cache keyed by ISBN not user PII |
| VI. Portable backend | Pass | Open Library behind port; swappable provider |
| VII. Hexagonal | Pass | `BookCatalogLookup` port; scanner as `BarcodeScanner` port |

**Post-design re-check**: Pass.

## Open Decisions

| ID | Decision | Status |
|----|----------|--------|
| OD-002-1 | Open Library as sole provider (B1) | **Settled** |
| OD-002-2 | WASM scanner on iOS; native API on Android when present (B2) | **Settled** |
| OD-002-3 | Manual row merge: normalized title + author both match when either lacks ISBN | **Settled** in research.md |

## Project Structure

### Documentation (this feature)

```text
specs/002-book-barcode-scan/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── book-catalog-api.md
│   └── ui-book-scan.md
└── tasks.md
```

### Source changes (incremental on 001)

```text
src/application/ports/book-catalog-lookup.ts
src/application/books/lookup-book.ts
src/application/books/upsert-from-catalog.ts
src/adapters/open-library/book-catalog-lookup.ts
src/adapters/postgres/catalog-cache-repository.ts
src/adapters/browser/barcode-scanner.ts
src/app/api/books/lookup/route.ts
src/components/books/scan-modal.tsx
src/components/books/catalog-preview.tsx
db/migrations/0002_book_catalog_fields.ts
db/migrations/0003_catalog_cache.ts
```

## Complexity Tracking

Empty — no constitution violations.
