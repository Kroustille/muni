# Research: Book barcode scan (002)

All Technical Context items resolved.

## 1. Catalog provider

- **Decision**: Open Library Search/API by ISBN (`https://openlibrary.org/isbn/{isbn}.json` + works/editions for metadata) and title search (`https://openlibrary.org/search.json`).
- **Rationale**: B1 — no API key; good ISBN coverage; fits X2 server proxy.
- **Alternatives**: Google Books (key, quotas); dual provider (rejected — extra scope).

## 2. Barcode scanning on mobile

- **Decision**: **iOS / PWA**: WASM-based scanner (continuous frames from `getUserMedia`). **Android**: use `BarcodeDetector` when `globalThis.BarcodeDetector` exists, else same WASM path.
- **Rationale**: B2 — iPhone is primary; BarcodeDetector unreliable on iOS Safari.
- **Alternatives**: ZXing-js only (heavier); native-only (fails B2 on iPhone).

## 3. ISBN validation

- **Decision**: Accept ISBN-10 and ISBN-13; normalize to ISBN-13 for storage and cache key; reject checksum failures before network.
- **Rationale**: Reduces junk lookups during continuous scan (B3).

## 4. Metadata localization

- **Decision**: Map Open Library fields to display strings with French preference: use `languages` / `title` variants when present; per-field fallback to English (L4). Application-layer normalizer, not in adapter SQL.
- **Rationale**: Consistent with movies/music features.

## 5. Merge without ISBN (B4)

- **Decision**: When adding by ISBN, if no row has that ISBN, find at most one active manual book where `normalize(title)` matches catalog title AND (`author` empty OR `normalize(author)` matches catalog author). Update that row; if multiple candidates, update none and create new (edge case — rare).
- **Rationale**: B4 without fuzzy magic dialogs.

## 6. Server cache (X4)

- **Decision**: PostgreSQL table `catalog_cache` with `provider`, `cache_key` (ISBN-13), `payload` jsonb, `fetched_at`; TTL 24h in application logic.
- **Rationale**: Reduces Open Library load; shared across users on self-hosted instance acceptable for public metadata.

## 7. Desktop scope (B9)

- **Decision**: Feature-detect mobile viewport + touch OR explicit `useIsMobile` hook used only to show scan/ISBN UI; desktop routes unchanged.
- **Rationale**: Clear product boundary.
