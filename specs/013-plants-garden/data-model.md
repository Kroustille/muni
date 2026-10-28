# Data Model: Plants & garden companion (013)

All user tables: composite PK `(user_id, id)`, `deleted_at`, `fields_updated_at` jsonb, `server_updated_at` timestamptz. Repositories scoped by `user_id`.

## plant

| Field | Type | Rules |
|-------|------|-------|
| `title` | text | Trimmed; length **1–500** (FR-002) |
| `locationTag` | enum | **`indoor`** \| **`outdoor`** \| **`both`** (FR-003); default **`indoor`** |
| `notes` | text null | Max **5000** |
| `careProfileId` | uuid null | P2; same-user `plant_care_profile.id` when set |
| `seasonalHints` | jsonb | P2; `PlantSeasonalHint[]`; LWW whole field; default `[]` |

### PlantSeasonalHint (inside `seasonalHints`)

| Field | Type | Rules |
|-------|------|-------|
| `id` | uuid | Stable within plant |
| `seasonKey` | enum null | `winter` \| `spring` \| `summer` \| `autumn` — optional if `monthRangeText` set |
| `monthRangeText` | text null | Max **100** — e.g. « Mars–avril » |
| `actionText` | text | Trimmed **1–500** |
| `sortOrder` | number | Stable ordering |

At least one of `seasonKey` or `monthRangeText` SHOULD be set for display grouping.

## plant_care_event

| Field | Type | Rules |
|-------|------|-------|
| `plantId` | uuid | Required; same-user `plant.id` |
| `eventType` | enum | **`water`** \| **`fertilize`** \| **`repot`** \| **`prune`** \| **`mist`** \| **`other`** (FR-004, FR-007) |
| `occurredAt` | date | Required; backdate allowed; **not future** (user TZ) (FR-005) |
| `notes` | text null | Max **2000** |
| `seasonalHintId` | uuid null | P2; links hint on plant when created via **Fait** |

**Constraints (application + push validation)**:
- **Dedupe**: at most **one** row with `eventType = water` per `(plantId, occurredAt calendar day)` (FR-006)
- Other event types: **no** same-day dedupe unless duplicate tap — allow multiple **`fertilize`** same day only if product changes (default: **allow** multiple non-water types same day)

**Derived (not stored)**:
- **Dernier arrosage** = `max(occurredAt)` where `eventType = water` and plant not deleted (FR-008)

## plant_care_profile (P2)

| Field | Type | Rules |
|-------|------|-------|
| `title` | text | **1–300** trimmed |
| `seasonalHints` | jsonb | Same shape as on `plant`; LWW whole field |

Copy profile onto plant: application merges hints with new uuid ids (client operation).

## vegetable_culture (P2)

| Field | Type | Rules |
|-------|------|-------|
| `title` | text | **1–500** trimmed (FR-010) |
| `locationNote` | text null | Max **300** |
| `variety` | text null | Max **200** |
| `notes` | text null | Max **5000** |
| `plantId` | uuid null | Optional future link — omitted in MVP UI |

## vegetable_milestone (P2)

| Field | Type | Rules |
|-------|------|-------|
| `cultureId` | uuid | Required; same-user `vegetable_culture.id` |
| `milestoneType` | enum | **`sow`** \| **`transplant`** \| **`thin`** \| **`harvest`** (FR-010) |
| `occurredAt` | date | Required; backdate allowed; not future |
| `notes` | text null | Max **2000** |

**Dedupe**: at most **one** row per `(cultureId, milestoneType, occurredAt calendar day)` (spec US5 default).

## Relationships

```text
User ──< plant ──< plant_care_event
User ──< plant_care_profile
User ──< plant ──optional careProfileId──> plant_care_profile
User ──< vegetable_culture ──< vegetable_milestone
```

## Recap eligibility (for 011)

| Source | Include when | Exclude when |
|--------|--------------|--------------|
| `plant_care_event` | `occurredAt` in period; parent `plant.deleted_at` null | plant soft-deleted |
| `vegetable_milestone` | `occurredAt` in period; parent culture not deleted | culture soft-deleted |

Mapping to `RecapAchievement`: see [research.md](research.md) § Recap signals and [contracts/plants-recap-port.md](contracts/plants-recap-port.md).

## Client local search (P2, not persisted)

Filter/sort plants by `normalizeText(title)` and `locationTag`; cultures by `normalizeText(title)`.

## FR mapping

| Requirement | Model |
|-------------|--------|
| FR-002–FR-003 | `plant` |
| FR-004–FR-008 | `plant_care_event` + derived last-watered |
| FR-009 | `plant.seasonalHints`, `plant_care_profile` |
| FR-010 | `vegetable_culture`, `vegetable_milestone` |
| FR-011 | All entities sync + soft delete |
| FR-012 | Events exposed via recap port — no shadow journal |
