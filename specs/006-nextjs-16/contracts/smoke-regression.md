# Contract: Smoke regression checklist (006)

Maps to spec **SC-002** and user stories **US1–US2**. Execute on a production build (`yarn build && yarn start`) or documented e2e equivalents.

| ID | Flow | Pass criteria |
|----|------|----------------|
| SM-001 | Offline open | Signed-in user with local data; disable network; app loads lists without error |
| SM-002 | Quick-add shopping | Add title-only shopping item; appears in list; French labels |
| SM-003 | Quick-add book | Add title-only book; appears in books list |
| SM-004 | Quick-add movie | Add title-only movie; appears in movies list |
| SM-005 | Quick-add recipe | Add title-only recipe; appears in recipes list |
| SM-006 | Music lists | Open artists and tracks routes; list renders |
| SM-007 | Global search | `/search` accepts query; results from local index |
| SM-008 | Auth | Magic link or Google sign-in reaches main app (online) |
| SM-009 | Expired session offline | Local data still readable; re-auth prompt non-blocking (match pre-upgrade) |
| SM-010 | PWA launch | Installed app opens to same entry as browser (SC-004) |
| SM-011 | Sync | After offline edit, reconnect; sync completes without user-blocking error |

**Note**: No new features from **007** are validated here — only parity with pre-upgrade behavior.
