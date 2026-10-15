# Muni Constitution

## Core Principles

### I. Offline-First, Always Instant
The UI reads and writes only to the on-device store. Every feature MUST work with no network connection. Network sync is a background concern and never blocks user interaction.

### II. Capture Speed Over Completeness
Adding an item MUST need only a type and a title. Every other field is optional. Quick add is reachable at the bottom of the screen, in thumb reach. Any change that adds friction to capture needs explicit justification.

### III. Typed Lists, Not Generic Notes
Each list type (shopping, books, movies, recipes) has its own fields and its own interactions. The product exists because generic tools do not fit specific needs. New fields and new types are added deliberately and incrementally.

### IV. Simplicity (YAGNI)
Ship the smallest slice that delivers value. Sync uses field-level last-write-wins with timestamps and soft deletes. No CRDTs, no live collaboration, no custom list builder, and no AI in v1.

### V. Privacy by Default
Each user can only access their own data, enforced at the database level (row-level security). No analytics and no third-party tracking.

### VI. Portable Backend
Self-hosting is a future goal. Use plain SQL migrations and a thin data-access layer so that no business logic depends on provider-specific features beyond Postgres and standard auth.

## Technology Constraints
- Mobile-first Progressive Web App, installable, also usable on desktop browsers.
- Next.js and TypeScript.
- Tailwind CSS for styling, with hand-built components and no component library.
- Light and dark mode following the system setting.
- Local store: IndexedDB. Backend: Postgres via Supabase (database and auth) for v1.
- Authentication: email magic link and Google sign-in. No passwords.
- UI language: French only in v1. All user-facing strings go through an i18n layer so other languages can be added.
- Scale target: one user's data, up to a few thousand items.

## Development Workflow
- Specs live in `specs/` and are produced with Spec Kit (specify, clarify, plan, tasks, implement).
- Sync logic and per-user data isolation MUST have automated tests. Offline behavior is verified before a feature is considered done.
- Features out of scope for v1 are tracked in the spec's "Out of Scope" section rather than half-built.

## Governance
This constitution supersedes other practices. Amendments are made by editing this file with a version bump and a note on what changed. Complexity beyond these principles must be justified in the plan's complexity tracking.

**Version**: 1.0.0 | **Ratified**: 2026-10-15 | **Last Amended**: 2026-10-15
