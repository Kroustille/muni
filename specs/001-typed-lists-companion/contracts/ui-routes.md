# Contract: Screens and routes

| Route | Purpose | Key behaviors |
|-------|---------|--------------|
| `/sign-in` | Magic link and Google sign-in | Email field, Google button, no password; offline message explaining one-time connection need; expired/used link message |
| `/auth/verify` | Magic link return (route handler) | Consumes the token, sets the session, redirects to `/`; expired or used link redirects to `/sign-in` with an error |
| `/auth/callback` | Google return (route handler) | Completes Google sign-in (state, code exchange, verified email), sets the session, redirects to `/` |
| `/api/auth/*`, `/api/sync/*`, `/api/health` | Backend endpoints (not screens) | See auth-api.md and remote-store.md |
| `/` | Home | Card per list with count and recent items (each row shows French type label + title, like search); search entry; empty state on first launch |
| `/lists/[type]` | List view (`shopping`, `books`, `movies`, `recipes`) | Status filter where applicable; **Trier par** + **Ordre** on every list (Note where ratings exist); check-off for shopping; personal rating color-coded when set; **list quick-add**; **Rechercher par titre** on books (all devices; scan mobile-only); movie catalog search |
| `/music/artists`, `/music/tracks` | Music lists (004) | Catalog **Rechercher**; artist **note** anytime; track **note** when `listened`; **Trier par** Date/Note + **Ordre** |
| `/items/[id]` | Detail and edit | Type-specific fields; recipe ingredients (quantity and name) and ordered steps; delete with Undo toast |
| `/search` | Cross-list search | Results show type; empty state; query runs **1s after typing stops** (submit still immediate) |
| `/settings` | Settings | Sign out |

Shared shell: bottom navigation includes a centered **+** control (`nav.quickAdd` accessible name) on all main app screens. From home or search it opens the type picker, then type-specific fields; closing the sheet **without saving** resets the picker (next generic open starts at type choice again). From a typed list (including `/music/artists` and `/music/tracks`) the same control opens quick-add **directly** for that list’s type. Each typed list screen also exposes an **Ajouter** control in the list header for the same one-step form. Only title/name required; reachable within 2 taps plus title from a list (SC-002). All strings come from `src/i18n/fr.json`. Theme follows system.

PWA: `manifest.webmanifest` (standalone display, icons, French name "Muni"); service worker precaches shell.
