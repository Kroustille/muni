# Contract: Quality gates (006)

Required commands for feature **006** completion (FR-007–FR-009). All MUST exit **0** on a clean checkout with documented prerequisites (Node 22+, `yarn install`).

| ID | Command | Required |
|----|---------|----------|
| QG-001 | `yarn typecheck` | Yes |
| QG-002 | `yarn lint` | Yes |
| QG-003 | `yarn test` | Yes |
| QG-004 | `yarn build` | Yes |
| QG-005 | `yarn build:migrations` | Yes |
| QG-006 | `yarn migrate:up` (Postgres up) | Yes in CI / when DB available |
| QG-007 | `yarn test:e2e` | When Docker stack available (same policy as pre-upgrade) |
| QG-008 | Coverage ≥80% on logic folders | Enforced by existing test tooling / CI |

**Out of scope**: Lowering coverage thresholds or skipping migration validation.
