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
Each user can only access their own data, enforced server-side: every data access is authorized against the authenticated user and scoped to that user, and automated isolation tests prove it. No analytics and no third-party tracking.

### VI. Portable Backend
The backend is self-hosted. Keep the schema in versioned, repository-tracked migrations and the data access behind ports, so that no business logic depends on a specific vendor or hosted service beyond PostgreSQL, and storage, email and identity providers stay replaceable adapters.

### VII. Domain-Driven, Hexagonal Architecture
The whole app is organized as a pure domain model, application use cases with ports (interfaces), and adapters that implement the ports (storage, backend, browser, UI). Dependencies point inward only: adapters depend on application and domain, application depends on domain, and the domain depends on nothing outside itself. Business rules live in the domain and use cases, never in adapters or UI components.

## Technology Constraints
- Mobile-first Progressive Web App, installable, also usable on desktop browsers.
- Next.js and TypeScript.
- Tailwind CSS for styling, with hand-built components and no component library.
- Light and dark mode following the system setting.
- Local store: IndexedDB. Backend: a TypeScript backend (Next.js route handlers) over self-hosted PostgreSQL for v1, reusing the shared domain code. No third-party backend-as-a-service.
- Authentication: email magic link (sent over SMTP) and Google sign-in, with server-side sessions. No passwords.
- UI language: French only in v1. All user-facing strings go through an i18n layer so other languages can be added.
- Scale target: one user's data, up to a few thousand items.

## Development Workflow
- Specs live in `specs/` and are produced with Spec Kit (specify, clarify, plan, tasks, implement).
- Development is test-driven: tests are written before the code they cover, in every user story (domain and port/use-case tests first, adapters after). Coverage MUST stay at or above 80% on the logic folders (domain, application, adapters, i18n); UI components are covered by end-to-end tests. An automated test enforces the dependency rule of Principle VII.
- Sync logic and per-user data isolation MUST have automated tests. Offline behavior is verified before a feature is considered done.
- All commit messages MUST follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification (`type(optional scope): description`, with `!` or a `BREAKING CHANGE:` footer for breaking changes).
- Features out of scope for v1 are tracked in the spec's "Out of Scope" section rather than half-built.

## Governance
This constitution supersedes other practices. Amendments are made by editing this file with a version bump and a note on what changed. Complexity beyond these principles must be justified in the plan's complexity tracking.

**Version**: 1.4.0 | **Ratified**: 2026-10-15 | **Last Amended**: 2026-10-15
