# Research: Next.js 16 platform upgrade (006)

## 1. Framework version target

- **Decision**: Upgrade `next` from `^15.5.28` to **`^16.0.2`** (or latest 16.x patch at implementation time); satisfy spec **FR-001** (minimum 16.0.0).
- **Rationale**: Next 16 is stable on npm (16.0.0+); staying on latest patch reduces known security and bundler fixes.
- **Alternatives**: Pin exact 16.0.0 (rejected — prefer caret on patch line); partial upgrade (rejected — FR-012 / spec edge case).

## 2. ESLint alignment

- **Decision**: Bump `eslint-config-next` to the **same major.minor** as `next` (16.x).
- **Rationale**: `eslint-config-next` ships framework-specific rules tied to Next version; mismatch causes false positives or missed deprecations.
- **Alternatives**: Keep eslint-config-next 15 (rejected — violates FR-010).

## 3. React / TypeScript

- **Decision**: Keep **React 19.3.x** and **@types/react 19.x**; adjust only if Next 16 peer dependency range requires a patch bump.
- **Rationale**: Muni already on React 19; Next 16 targets React 19.
- **Alternatives**: Downgrade React (rejected).

## 4. PWA / Serwist

- **Decision**: Verify **`@serwist/next` ^9.5.x** against Next 16 release notes and Serwist changelog; upgrade Serwist minor if maintainers document Next 16 support gap.
- **Rationale**: Service worker built via `withSerwistInit` in `next.config.ts` and `src/app/sw.ts` — build failure here blocks FR-004.
- **Alternatives**: Replace Serwist (rejected — out of scope).

## 5. Breaking-change audit areas (checklist)

- **Decision**: Explicitly read Next 16 migration guide for: **App Router** caching defaults, **`next/image`**, **middleware** (`src/middleware.ts` if present), **Route Handlers**, **Turbopack** default in `next dev`, and **TypeScript** `next-env.d.ts` regeneration.
- **Rationale**: FR-011 requires documented resolution, not silent regressions.
- **Alternatives**: Upgrade blind and fix tests only (rejected — misses PWA/auth edge cases).

## 6. Auth and adapters

- **Decision**: Smoke-test **magic link** + **Google** + **jose** session handling after upgrade; no adapter rewrites unless TypeScript or Next request API changes force it.
- **Rationale**: FR-006; adapters are thin route wrappers.
- **Alternatives**: Rewrite auth (rejected).

## 7. CI / quality gates

- **Decision**: Same commands as [contracts/quality-gates.md](contracts/quality-gates.md); no threshold changes.
- **Rationale**: FR-007–FR-009 and constitution coverage rule.
- **Alternatives**: Skip e2e locally (acceptable only when Docker unavailable — unchanged policy).

## 8. Sequencing with 007

- **Decision**: Land **006** on `main` before **007** UI bulk work when possible; if parallel branches, rebase **007** onto **006** before merge.
- **Rationale**: Spec P5 and roadmap — reduces dual-risk merges.
- **Alternatives**: Merge 007 first (rejected for recommended flow).
