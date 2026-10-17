# Data Model: Next.js 16 platform upgrade (006)

This feature does **not** introduce or change persisted domain entities, database tables, or IndexedDB stores.

## Conceptual artifacts (documentation only)

### Quality gate run

| Field | Type | Rules |
|-------|------|-------|
| `commands` | string[] | Ordered list from [contracts/quality-gates.md](contracts/quality-gates.md) |
| `requiredPass` | boolean | All required commands exit 0 for feature complete |
| `recordedAt` | ISO timestamp | Optional note in PR/commit body when validating |

### Release baseline

| Field | Type | Rules |
|-------|------|-------|
| `nextVersion` | semver range | Must satisfy `>=16.0.0` per FR-001 |
| `previousNextVersion` | semver range | `^15.5.x` before upgrade |
| `breakingChangesResolved` | string[] | IDs or short titles from research.md §5 audit |

## Unchanged entities

- **Item**, quotes, goals, sync payloads — no migration for 006.
- **Session / user** — auth schema unchanged.
