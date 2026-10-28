# Data Model: Activity suggestions (014)

**Scope**: Client-only preference/projection data. **No** Postgres tables in MVP. Domain items remain authoritative in existing stores.

## SuggestionDomainId

Stable string ids for scoring, diversity, and deep links:

| `domainId` | Source feature |
|------------|----------------|
| `book` | 002 |
| `movie` | 003 (film + série) |
| `music_track` | 004 listening backlog |
| `recipe` | 001 recipes |
| `fitness` | 008 |
| `music_practice` | 012 (composition, DJ, apprentissage) |
| `plants` | 013 |

**Excluded**: `shopping`, quote captures, artist-only rows without track backlog.

## SuggestionKind

Per-domain subtype for copy templates (see [research.md](research.md)):

| Domain | Examples |
|--------|----------|
| `book` | `resume_reading`, `start_to_read` |
| `movie` | `watch_film`, `continue_series`, `start_series` |
| `music_track` | `listen_backlog` |
| `recipe` | `cook_first`, `cook_again` |
| `fitness` | `resume_training`, `unblock_skipped` |
| `music_practice` | `advance_composition`, `prepare_dj_set`, `practice_session` |
| `plants` | `water_plant`, `potager_milestone` |

## ActivitySuggestionCandidate (computed — not persisted as entity)

| Field | Type | Rules |
|-------|------|-------|
| `domainId` | `SuggestionDomainId` | Required |
| `itemId` | string (uuid) | Required; unique per domain store |
| `kind` | `SuggestionKind` | Required |
| `title` | string | French display title from domain row |
| `subtitle` | string null | Soft French template; **no** numeric day count in primary UI |
| `staleAnchorDate` | ISO date (local) | Max of domain-specific signals |
| `score` | number | Whole local days since anchor (research) |
| `deepLink` | string | App path per [contracts/suggestion-deep-links.md](contracts/suggestion-deep-links.md) |
| `primaryActionKey` | string | i18n key for button label (`open`, `start`, domain-specific) |

**Validation**: `score >= domain.minStaleDays`; item not soft-deleted; not in today's dismiss set; not duplicate `itemId` in snapshot.

## ActivitySuggestionSlot (within snapshot)

| Field | Type | Rules |
|-------|------|-------|
| `slotId` | uuid | Stable for dismiss targeting (`snapshotId` + slot index) |
| `candidate` | `ActivitySuggestionCandidate` | Required when slot filled |
| `dismissedAt` | ISO datetime null | Set when user dismisses row for today |

## DailyActivitySuggestionSnapshot (persisted)

IndexedDB record — **one logical row per user per calendar day** (upsert on first Accueil visit).

| Field | Type | Rules |
|-------|------|-------|
| `calendarDay` | string | `YYYY-MM-DD` in user TZ (default Europe/Paris) |
| `snapshotId` | uuid | Generated on first compute for `calendarDay` |
| `computedAt` | ISO datetime | First visit timestamp |
| `slots` | `ActivitySuggestionSlot[]` | Length **0–2**; never backfill above initial pick count |
| `blockDismissed` | boolean | When true, hide entire Accueil card for `calendarDay` |
| `timeZone` | string | IANA id used for `calendarDay` |

**Invariants**:
- If ≥2 eligible at compute time → exactly **two** non-null slots (FR-002).
- Revisit same day → return same `snapshotId` and candidates unless dismiss mutates slots.
- Next local day → new snapshot; prior day rows may be garbage-collected (keep last 7 days optional).

## ActivitySuggestionDismiss (persisted — optional normalized form)

Alternative to `slot.dismissedAt` only: redundant index for analytics-free queries.

| Field | Type | Rules |
|-------|------|-------|
| `calendarDay` | string | Same as snapshot |
| `slotId` | uuid | Or `(domainId, itemId)` pair — **plan: use `slotId`** |
| `dismissedAt` | ISO datetime | Required |

**MVP**: Dismiss state MAY live only on `slots[].dismissedAt` inside snapshot document; adapter hides storage shape from use cases.

## ActivitySuggestionsViewModel (UI projection)

| Field | Type | Rules |
|-------|------|-------|
| `introKey` | string | e.g. `suggestions.intro` |
| `visibleSlots` | slot[] | Filter `dismissedAt == null` |
| `showEmptyNeutral` | boolean | One candidate → neutral copy (US1) |
| `hidden` | boolean | Zero candidates or `blockDismissed` |

## P2 (out of scope MVP)

| Entity | Purpose |
|--------|---------|
| `ActivitySuggestionSnooze` | `(domainId, itemId, snoozedUntil)` exclude from pool |
| User setting | Disable card or adjust `minStaleDays` |

## Relationships

```text
Domain stores (books, items, fitness, …)
        │ read-only
        ▼
Contributors → Candidate pool → buildDailySuggestions
        │
        ▼
DailyActivitySuggestionSnapshot (IndexedDB)
        │
        ▼
Accueil card / Récap teaser (read ViewModel)
```

No foreign keys to Postgres; `itemId` validated at deep-link navigation time (404 if deleted).
