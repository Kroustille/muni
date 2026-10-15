# Contract: Screens and routes

| Route | Purpose | Key behaviors |
|-------|---------|--------------|
| `/sign-in` | Magic link and Google sign-in | Email field, Google button, no password; offline message explaining one-time connection need; expired/used link message |
| `/auth/verify` | Magic link return (route handler) | Consumes the token, sets the session, redirects to `/`; expired or used link redirects to `/sign-in` with an error |
| `/auth/callback` | Google return (route handler) | Completes Google sign-in (state, code exchange, verified email), sets the session, redirects to `/` |
| `/api/auth/*`, `/api/sync/*`, `/api/health` | Backend endpoints (not screens) | See auth-api.md and remote-store.md |
| `/` | Home | Card per list with count and recent items; search entry; empty state on first launch |
| `/lists/[type]` | List view (`shopping`, `books`, `movies`, `recipes`) | Status filter where applicable; check-off for shopping; rating for read/watched |
| `/items/[id]` | Detail and edit | Type-specific fields; recipe ingredients (quantity and name) and ordered steps; delete with Undo toast |
| `/search` | Cross-list search | Results show type; empty state; query runs **2s after typing stops** (submit still immediate) |
| `/settings` | Settings | Sign out |

Shared shell: bottom quick-add button on home, list and search screens. Flow: choose type, then type-specific fields with only title/name required; reachable within 3 taps plus title (SC-002). All strings come from `src/i18n/fr.json`. Theme follows system.

PWA: `manifest.webmanifest` (standalone display, icons, French name "Muni"); service worker precaches shell.
