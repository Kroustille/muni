# Quickstart: Next.js 16 platform upgrade (006)

**Prerequisites**: Muni **001–005** behavior on current `main`; Docker optional for e2e.

## After implementation (T601+)

### 1. Toolchain

1. `yarn install` on a clean lockfile after dependency bump.
2. Confirm `package.json` shows `next` **≥16.0.0** and matching `eslint-config-next`.

### 2. Automated gates

Run commands in [contracts/quality-gates.md](contracts/quality-gates.md):

1. `yarn typecheck`
2. `yarn lint`
3. `yarn test` (and `yarn test:coverage` if validating coverage locally)
4. `yarn build`
5. `yarn build:migrations` && `yarn migrate:up` (with `yarn db:up` if Postgres needed)

### 3. Smoke regression (manual or e2e)

Follow [contracts/smoke-regression.md](contracts/smoke-regression.md):

- Offline open + one list visible
- Quick-add title-only on shopping and books
- Global search page loads
- Sign-in once (magic link or Google) if testing auth
- PWA: install or launch from installed icon (one mobile + one desktop browser)

### 4. PWA / service worker

1. `yarn build && yarn start`
2. DevTools → Application → Service worker registers without error
3. Hard refresh offline → app shell still loads

### 5. Regression sign-off

Compare to pre-upgrade: no new English UI strings; sync after offline edit still non-blocking.
